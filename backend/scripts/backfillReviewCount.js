/**
 * One-time migration: backfill reviewCount on all Book documents.
 * Run once: node backend/scripts/backfillReviewCount.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Review = require('../models/Review');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const counts = await Review.aggregate([
    { $group: { _id: '$book', count: { $sum: 1 } } },
  ]);

  const ops = counts.map(({ _id, count }) => ({
    updateOne: { filter: { _id }, update: { $set: { reviewCount: count } } },
  }));

  if (ops.length > 0) {
    const result = await Book.bulkWrite(ops);
    console.log(`Updated ${result.modifiedCount} books`);
  }

  // Zero out books with no reviews (in case they were missed)
  const bookIdsWithReviews = counts.map((c) => c._id);
  const zeroResult = await Book.updateMany(
    { _id: { $nin: bookIdsWithReviews } },
    { $set: { reviewCount: 0 } }
  );
  console.log(`Zeroed out ${zeroResult.modifiedCount} books with no reviews`);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
