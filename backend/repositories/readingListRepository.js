const ReadingList = require('../models/ReadingList');

exports.upsert = (userId, bookId, status) =>
  ReadingList.findOneAndUpdate(
    { user: userId, book: bookId },
    { status },
    { upsert: true, new: true }
  );

exports.findByUser = (userId) =>
  ReadingList.find({ user: userId })
    .populate('book', 'title author coverImage genre averageRating')
    .sort({ updatedAt: -1 });

exports.deleteOne = (userId, bookId) =>
  ReadingList.deleteOne({ user: userId, book: bookId });

exports.findOne = (userId, bookId) =>
  ReadingList.findOne({ user: userId, book: bookId });

exports.deleteMany = (filter) => ReadingList.deleteMany(filter);
