const logger = require('../config/logger');
const bookRepo = require('../repositories/bookRepository');
const { TTL, getOrSet, del, delPattern, bookListKey, bookDetailKey } = require('../utils/cache');

exports.getAllBooks = async ({ search, genre, minRating, sort, page, limit }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));

  const key = bookListKey({ search, genre, minRating, sort, page: pageNum, limit: limitNum });

  return getOrSet(key, async () => {
    const skip = (pageNum - 1) * limitNum;
    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { author: regex }, { description: regex }];
    }

    if (genre && genre !== 'All') filter.genre = genre;
    if (minRating) filter.averageRating = { $gte: Number(minRating), $ne: null };

    const ratingSort = sort === 'highest_rated' || sort === 'lowest_rated';
    if (ratingSort) filter.averageRating = { ...filter.averageRating, $ne: null };

    const sortOptions = {
      newest:        { createdAt: -1 },
      oldest:        { createdAt: 1 },
      highest_rated: { averageRating: -1 },
      lowest_rated:  { averageRating: 1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const [books, totalCount] = await Promise.all([
      bookRepo.findWithFilter({ filter, sortBy, skip, limitNum }),
      bookRepo.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);
    return { data: books, totalCount, page: pageNum, limit: limitNum, totalPages, hasNextPage: pageNum < totalPages };
  }, TTL.BOOK_LIST);
};

exports.getBookById = async (id) => {
  return getOrSet(bookDetailKey(id), async () => {
    const book = await bookRepo.findById(id);
    if (!book) throw Object.assign(new Error('Book not found'), { status: 404 });
    return book.toObject();
  }, TTL.BOOK_DETAIL);
};

exports.createBook = async ({ title, author, description, genre, coverImage, createdBy }) => {
  const book = await bookRepo.create({
    title,
    author,
    description,
    genre: genre || '',
    coverImage: coverImage || '',
    createdBy,
  });
  logger.info({ bookId: book._id, title, createdBy }, 'Book created');
  await delPattern('books:list:*');
  return book;
};

exports.updateBook = async (id, { title, author, description, genre, coverImage }) => {
  const book = await bookRepo.findByIdRaw(id);
  if (!book) throw Object.assign(new Error('Book not found'), { status: 404 });

  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (description !== undefined) book.description = description;
  if (genre !== undefined) book.genre = genre;
  if (coverImage !== undefined) book.coverImage = coverImage;

  await book.save();
  await Promise.all([del(bookDetailKey(id)), delPattern('books:list:*')]);
  return book;
};

exports.deleteBook = async (id) => {
  const book = await bookRepo.findByIdRaw(id);
  if (!book) throw Object.assign(new Error('Book not found'), { status: 404 });
  await book.deleteOne();
  logger.info({ bookId: id, title: book.title }, 'Book deleted');
  await Promise.all([del(bookDetailKey(id)), delPattern('books:list:*')]);
};
