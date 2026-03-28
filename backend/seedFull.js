/**
 * seedFull.js — Full database seeder
 *
 * Creates:
 *   - 500 users
 *   - ~1000 books via Open Library batch ISBN lookup (fallback to synthetic)
 *   - 5000 reviews distributed across users & books
 *
 * Usage:  node backend/seedFull.js
 * Flags:  --clear   wipe existing users/books/reviews first
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const https = require('https');

const User   = require('./models/User');
const Book   = require('./models/Book');
const Review = require('./models/Review');

// ─── Config ───────────────────────────────────────────────────────────────────
const TARGET_USERS   = 500;
const TARGET_BOOKS   = 1000;
const TARGET_REVIEWS = 5000;
const CLEAR          = process.argv.includes('--clear');

// ─── ISBN pool (real ISBNs across all genres) ─────────────────────────────────
// Open Library batch API supports up to 20 per request.
const ISBN_POOL = [
  // Fiction
  '9780743273565','9780316769174','9780061965081','9780451524935','9780141187761',
  '9780385490818','9780385333849','9781594631931','9780316346627','9780525559474',
  '9780385340977','9780735224292','9781501156700','9780307588364','9780143127741',
  '9780525478812','9780553380163','9780062409850','9780525559498','9780385545525',
  '9780385354684','9780812981605','9780374104047','9780062979834','9781250301697',
  '9780316556347','9780812993547','9780385544153','9781250244178','9780385545136',
  // Mystery & Thriller
  '9780525537984','9780316055437','9780062945211','9780385541299','9781250178602',
  '9780316346627','9781250116079','9780385541565','9780062943217','9780525538615',
  '9780385545020','9781250301680','9780525537977','9780062985491','9780316485661',
  '9780316377874','9780593310182','9781250178596','9780062978219','9780525537960',
  // Science Fiction
  '9780062316097','9780385333481','9780441569595','9780765348357','9780316346962',
  '9780385533225','9780593135204','9780441013593','9780316010191','9781101972120',
  '9780765326355','9780553573404','9780062658708','9780765326362','9780399177828',
  '9780525559276','9780765326379','9780593135471','9780062871565','9780316452472',
  // Fantasy
  '9780618640157','9780618346257','9780261102217','9780679600848','9780385121675',
  '9780062315007','9780765326355','9780451524935','9780316438988','9780525508564',
  '9780062409867','9780062409874','9781250301673','9780062974174','9780593135181',
  '9780593135198','9780062974181','9781101972052','9780765390585','9780316388580',
  // Romance
  '9780593198919','9780593310175','9781250244154','9781250244161','9780593135167',
  '9780593135174','9781250301697','9780593310168','9780062978196','9780062978202',
  '9780525555378','9780525555385','9780525555392','9781250301710','9780593135150',
  // Biography & Memoir
  '9780307277671','9780812993530','9780385540780','9781476753836','9780385543897',
  '9780399592683','9780525559450','9780593135112','9780385543156','9781250301666',
  '9780307946515','9780525537984','9780062662613','9780525555361','9780525555409',
  '9780385544139','9780062662637','9780374277222','9781250178619','9780385544153',
  // Self-Help
  '9780316931984','9780735224292','9780316167567','9780316204552','9781501156700',
  '9780525559481','9780525555354','9780062662644','9780525537991','9780593135129',
  '9781250244185','9780593135136','9780062662651','9780385545518','9780593135143',
  // Historical Fiction
  '9780385547345','9780385547352','9781476746586','9780385549431','9780385549448',
  '9780593135105','9780593135112','9781250244192','9780525555416','9780593135099',
  '9780062662668','9780525559467','9780593135082','9780062662682','9780385549455',
  // Horror
  '9780385121675','9780307743657','9780525555422','9780385547360','9780593310175',
  '9780593135068','9780062662699','9780593135075','9780525537953','9780062662705',
  '9780385547376','9780525555429','9780593135051','9780062662712','9780385547383',
  // Poetry
  '9780374275617','9780062662729','9780593135044','9780525555436','9780385547390',
  '9780593135037','9780062662736','9780525537946','9780593135020','9780062662743',
  // Additional popular titles to pad the pool
  '9780062887351','9781250312853','9781250312860','9780385543910','9780385543927',
  '9780593310199','9780593310206','9780525559511','9780525559528','9780525559535',
  '9780593135013','9780593135006','9780062662750','9780062662767','9780062662774',
  '9780385543934','9780385543941','9780593310213','9780593310220','9780525559542',
  '9780525559559','9780525559566','9780525559573','9780593135246','9780593135253',
  '9780593135260','9780593135277','9780593135284','9780593135291','9780593135307',
];

// ─── Genre map (Open Library subject → our genre) ─────────────────────────────
const GENRES = ['Fiction','Non-Fiction','Mystery','Science Fiction','Fantasy',
  'Romance','Thriller','Biography','Self-Help','Historical Fiction','Horror','Poetry','Other'];

function guessGenre(subjects = []) {
  const s = subjects.map(x => (x.name || x).toLowerCase()).join(' ');
  if (/sci(ence)?[- ]fi|space|dystop/i.test(s))    return 'Science Fiction';
  if (/fantas|magic|dragon|wizard/i.test(s))        return 'Fantasy';
  if (/horror|ghost|supernatural/i.test(s))         return 'Horror';
  if (/myster|detective|crime/i.test(s))            return 'Mystery';
  if (/thriller|suspense/i.test(s))                 return 'Thriller';
  if (/romance|love story/i.test(s))                return 'Romance';
  if (/biograph|memoir|autobio/i.test(s))           return 'Biography';
  if (/self.help|personal development|mindful/i.test(s)) return 'Self-Help';
  if (/histor/i.test(s))                            return 'Historical Fiction';
  if (/poetry|poems/i.test(s))                      return 'Poetry';
  if (/fiction/i.test(s))                           return 'Fiction';
  if (/non.fiction|essay/i.test(s))                 return 'Non-Fiction';
  return 'Other';
}

// ─── Synthetic fallback data ──────────────────────────────────────────────────
const SYNTH_FIRST  = ['The','A','Lost','Dark','Bright','Hollow','Broken','Wild','Ancient','Last'];
const SYNTH_SECOND = ['Kingdom','Shadow','Garden','River','Storm','Mirror','Forest','Flame','Echo','Dream'];
const SYNTH_THIRD  = ['of Fate','of Stars','at Midnight','in Winter','Beyond','Within','Untold','Reborn','Forever','Again'];
const SYNTH_AUTHORS = [
  'James Hartwell','Sophie Lane','Marcus Chen','Elena Novak','Daniel Wright',
  'Aria Kim','Leo Fitzgerald','Nora Ashford','Sam Okafor','Clara Voss',
  'Victor Reyes','Isla Thornton','Owen Blake','Mia Castellano','Ethan Park',
  'Lydia Sinclair','Nathan Drake','Fiona Webb','Hugo Moreau','Priya Sharma',
];
const SYNTH_DESCS = [
  'A gripping tale that will keep you turning pages long into the night.',
  'An unforgettable journey through triumph, loss, and the enduring power of hope.',
  'A beautifully written story exploring the bonds between people across time.',
  'Masterfully crafted prose weaving together mystery, heart, and revelation.',
  'A bold debut that announces a major new voice in contemporary literature.',
  'Epic in scope yet intimate in detail—a true modern classic.',
  'Thought-provoking and searingly honest, this book will change how you see the world.',
  'A dazzling story full of surprises, warmth, and unforgettable characters.',
  'Lyrical and haunting, with a finale that stays with you for years.',
  'A page-turner that blends heart-pounding tension with genuine emotional depth.',
];

function syntheticBook(i, adminId) {
  const title  = `${pick(SYNTH_FIRST)} ${pick(SYNTH_SECOND)} ${pick(SYNTH_THIRD)}`;
  const genre  = GENRES[i % GENRES.length];
  return {
    title,
    author:      pick(SYNTH_AUTHORS),
    description: pick(SYNTH_DESCS),
    genre,
    coverImage:  '',
    createdBy:   adminId,
  };
}

// ─── Review content ───────────────────────────────────────────────────────────
const REVIEW_COMMENTS = [
  'Absolutely loved this book. Could not put it down from start to finish.',
  'A slow start but it picked up beautifully. The ending left me speechless.',
  'One of the best books I have read this year. Highly recommend to everyone.',
  'Interesting premise but the execution felt a bit uneven in the middle.',
  'The characters felt so real—I found myself caring deeply about each one.',
  'Beautifully written prose that makes even mundane moments feel profound.',
  'Not my usual genre but I am so glad I gave it a chance. Wonderful.',
  'The plot twists were genuinely surprising and very well set up.',
  'A bit overrated in my opinion, but still an enjoyable read overall.',
  'Perfect for a rainy afternoon. Cozy, moving, and thought-provoking.',
  'The author has an incredible gift for capturing human emotion.',
  'I devoured this in a single weekend. Completely addictive.',
  'Dense but rewarding—every page rewards careful attention.',
  'Surprisingly funny in places. A welcome balance to the heavy themes.',
  'The world-building is extraordinary. I did not want to leave this universe.',
  'Felt a bit too long in the middle third, but the payoff was worth it.',
  'A quiet, understated masterpiece that deserves far more attention.',
  'Gripping from the very first line. Highly recommended.',
  'The ending felt rushed, but the journey getting there was fantastic.',
  'Changed my perspective in ways I did not expect. Genuinely moving.',
];
const TAGS_POOL = ['Spoiler-Free','Contains Spoilers','Detailed Analysis','Quick Read',
  'Must Read','Slow Burn','Highly Recommended','Not For Everyone','Beginner Friendly','Classic'];
const PROS_POOL = ['Great characters','Compelling plot','Beautiful writing',
  'Fast-paced','Emotional depth','Unique premise','Strong ending','World-building'];
const CONS_POOL = ['Slow start','Predictable ending','Underdeveloped side characters',
  'Pacing issues','Too long','Confusing at times','Weak dialogue'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BookReviewApp-Seeder/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    }).on('error', () => resolve({}));
  });
}

// ─── Open Library batch fetch ─────────────────────────────────────────────────
async function fetchIsbnBatch(isbns, adminId) {
  const bibkeys = isbns.map(i => `ISBN:${i}`).join(',');
  const url = `https://openlibrary.org/api/books?bibkeys=${bibkeys}&format=json&jscmd=data`;
  const raw = await httpGet(url);
  const books = [];

  for (const isbn of isbns) {
    const key  = `ISBN:${isbn}`;
    const data = raw[key];
    if (!data || !data.title) continue;

    const author = data.authors?.[0]?.name || 'Unknown Author';
    const cover  = data.cover?.large || data.cover?.medium || '';
    const genre  = guessGenre(data.subjects || []);

    books.push({
      title:      data.title,
      author,
      description: data.notes?.value || data.description?.value || data.description || '',
      genre,
      coverImage: cover,
      createdBy:  adminId,
    });
  }
  return books;
}

async function fetchAllFromIsbn(adminId) {
  const BATCH = 20;
  const collected = [];

  console.log(`\n📚 Fetching books from Open Library in batches of ${BATCH}...`);

  for (let i = 0; i < ISBN_POOL.length; i += BATCH) {
    const batch = ISBN_POOL.slice(i, i + BATCH);
    const books = await fetchIsbnBatch(batch, adminId);
    collected.push(...books);
    process.stdout.write(`\r   Fetched ${collected.length} real books (batch ${Math.ceil((i + BATCH) / BATCH)}/${Math.ceil(ISBN_POOL.length / BATCH)})...`);
    await sleep(600); // respect rate limits
  }

  console.log(`\n   ✅ ${collected.length} books retrieved from Open Library`);
  return collected;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  if (CLEAR) {
    await Promise.all([User.deleteMany({}), Book.deleteMany({}), Review.deleteMany({})]);
    console.log('🗑️  Cleared existing users, books, and reviews');
  }

  // ── 1. Ensure admin exists ──────────────────────────────────────────────────
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10);
    admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: hash, role: 'admin' });
    console.log('👤 Admin user created');
  }

  // ── 2. Create 500 users ─────────────────────────────────────────────────────
  console.log(`\n👥 Creating ${TARGET_USERS} users...`);
  const sharedHash = await bcrypt.hash('password123', 10);

  const existingCount = await User.countDocuments({ role: 'user' });
  const usersToCreate = TARGET_USERS - existingCount;

  let users = await User.find({ role: 'user' }).select('_id').lean();

  if (usersToCreate > 0) {
    const FIRST_NAMES = ['Alice','Bob','Charlie','Diana','Evan','Fiona','George','Hannah',
      'Ivan','Julia','Kevin','Laura','Mike','Nina','Oscar','Paula','Quinn','Rachel',
      'Steve','Tina','Uma','Victor','Wendy','Xena','Yusuf','Zara','Aaron','Bella',
      'Carlos','Demi','Eli','Faith','Gabe','Holly','Igor','Jade','Karl','Lily',
      'Mason','Nadia','Owen','Petra','Ravi','Sara','Tom','Ursula','Vince','Willa'];
    const LAST_NAMES  = ['Smith','Jones','Taylor','Brown','Wilson','Davis','Miller','Moore',
      'Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia',
      'Martinez','Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall',
      'Allen','Young','King','Wright','Scott','Green','Baker','Adams','Nelson',
      'Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell'];

    const docs = [];
    for (let i = 0; i < usersToCreate; i++) {
      const first = FIRST_NAMES[i % FIRST_NAMES.length];
      const last  = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
      docs.push({
        name:     `${first} ${last}`,
        email:    `user${existingCount + i + 1}@example.com`,
        password: sharedHash,
        role:     'user',
      });
    }
    const inserted = await User.insertMany(docs, { ordered: false }).catch(e => {
      // ignore duplicate key errors
      return e.insertedDocs || [];
    });
    console.log(`   ✅ ${inserted.length} new users created (password: password123)`);
    users = await User.find({ role: 'user' }).select('_id').lean();
  } else {
    console.log(`   ⏭️  Already have ${existingCount} users, skipping`);
  }

  const userIds = users.map(u => u._id);

  // ── 3. Fetch books from Open Library ───────────────────────────────────────
  const existingBooks = await Book.countDocuments();
  let bookIds = [];

  if (existingBooks >= TARGET_BOOKS) {
    console.log(`\n⏭️  Already have ${existingBooks} books, skipping`);
    bookIds = (await Book.find().select('_id').lean()).map(b => b._id);
  } else {
    const booksNeeded = TARGET_BOOKS - existingBooks;
    const realBooks   = await fetchAllFromIsbn(admin._id);

    // Deduplicate by title
    const seen  = new Set();
    const deduped = [];
    for (const b of realBooks) {
      const key = b.title.toLowerCase();
      if (!seen.has(key)) { seen.add(key); deduped.push(b); }
    }

    // Fill remainder with synthetic books
    let toInsert = deduped.slice(0, booksNeeded);
    if (toInsert.length < booksNeeded) {
      const needed = booksNeeded - toInsert.length;
      console.log(`\n🔧 Generating ${needed} synthetic books to reach ${TARGET_BOOKS} total...`);
      for (let i = 0; i < needed; i++) {
        toInsert.push(syntheticBook(i, admin._id));
      }
    }

    console.log(`\n💾 Inserting ${toInsert.length} books into database...`);
    const BOOK_BATCH = 200;
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += BOOK_BATCH) {
      const chunk  = toInsert.slice(i, i + BOOK_BATCH);
      const result = await Book.insertMany(chunk, { ordered: false });
      inserted += result.length;
      process.stdout.write(`\r   ${inserted}/${toInsert.length} books saved...`);
    }
    console.log(`\n   ✅ ${inserted} books saved`);

    bookIds = (await Book.find().select('_id').lean()).map(b => b._id);
  }

  // ── 4. Create 5000 reviews ──────────────────────────────────────────────────
  const existingReviews = await Review.countDocuments();
  const reviewsNeeded   = TARGET_REVIEWS - existingReviews;

  if (reviewsNeeded <= 0) {
    console.log(`\n⏭️  Already have ${existingReviews} reviews, skipping`);
  } else {
    console.log(`\n⭐ Creating ${reviewsNeeded} reviews...`);

    const reviewDocs = [];
    for (let i = 0; i < reviewsNeeded; i++) {
      const numTags = rand(0, 3);
      const numPros = rand(0, 3);
      const numCons = rand(0, 2);
      reviewDocs.push({
        rating:  rand(1, 5),
        comment: pick(REVIEW_COMMENTS),
        tags:    pickN(TAGS_POOL, numTags),
        pros:    pickN(PROS_POOL, numPros),
        cons:    pickN(CONS_POOL, numCons),
        user:    userIds[i % userIds.length],
        book:    bookIds[rand(0, bookIds.length - 1)],
      });
    }

    // Insert in batches
    const REVIEW_BATCH = 500;
    let insertedReviews = 0;
    for (let i = 0; i < reviewDocs.length; i += REVIEW_BATCH) {
      const chunk = reviewDocs.slice(i, i + REVIEW_BATCH);
      await Review.insertMany(chunk, { ordered: false });
      insertedReviews += chunk.length;
      process.stdout.write(`\r   ${insertedReviews}/${reviewsNeeded} reviews saved...`);
    }
    console.log(`\n   ✅ ${insertedReviews} reviews saved`);
  }

  // ── 5. Recalculate averageRating for all books ─────────────────────────────
  console.log('\n📊 Recalculating average ratings...');
  const ratings = await Review.aggregate([
    { $group: { _id: '$book', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const bulkOps = ratings.map(r => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { averageRating: Math.round(r.avg * 10) / 10 } },
    },
  }));

  if (bulkOps.length) {
    await Book.bulkWrite(bulkOps);
    console.log(`   ✅ Updated ratings for ${bulkOps.length} books`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const [uCount, bCount, rCount] = await Promise.all([
    User.countDocuments(),
    Book.countDocuments(),
    Review.countDocuments(),
  ]);

  console.log('\n🎉 Seed complete!');
  console.log(`   Users:   ${uCount}`);
  console.log(`   Books:   ${bCount}`);
  console.log(`   Reviews: ${rCount}`);
  console.log('\n   All regular users → email: user1@example.com … user500@example.com');
  console.log('   Password for all users → password123\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
