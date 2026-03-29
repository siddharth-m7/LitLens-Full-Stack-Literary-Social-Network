const Review = require('../models/Review');

exports.create = (data) => Review.create(data);

exports.findById = (id) => Review.findById(id);

exports.findByBook = (bookId) => Review.find({ book: bookId });

exports.findByUser = ({ userId, skip, limitNum }) =>
  Review.find({ user: userId })
    .populate('book', 'title author')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

exports.countByUser = (userId) => Review.countDocuments({ user: userId });

exports.countDocuments = (filter) => Review.countDocuments(filter);

exports.findByUserWithBook = (userId) =>
  Review.find({ user: userId })
    .populate('book', 'title author coverImage')
    .sort({ createdAt: -1 });

exports.findByUserSelectBook = (userId) =>
  Review.find({ user: userId }).select('book').lean();

exports.deleteMany = (filter) => Review.deleteMany(filter);

exports.aggregate = (pipeline) => Review.aggregate(pipeline);
