const Favorite = require('../models/Favorite');

exports.findOne = (userId, bookId) => Favorite.findOne({ user: userId, book: bookId });

exports.create = (userId, bookId) => Favorite.create({ user: userId, book: bookId });

exports.findByUser = (userId) =>
  Favorite.find({ user: userId })
    .populate('book', 'title author coverImage genre averageRating')
    .sort({ createdAt: -1 });

exports.deleteMany = (filter, session) =>
  Favorite.deleteMany(filter, session ? { session } : {});
