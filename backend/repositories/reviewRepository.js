const Review = require('../models/Review');

exports.create = (data) => Review.create(data);

exports.findById = (id) => Review.findById(id);

exports.findByBook = (bookId) => Review.find({ book: bookId });

exports.findByBookPaginated = ({ bookId, skip, limitNum }) =>
  Review.find({ book: bookId })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

exports.countByBook = (bookId) => Review.countDocuments({ book: bookId });

exports.findByUserPublicPaginated = ({ userId, skip, limitNum }) =>
  Review.find({ user: userId })
    .populate('book', 'title author coverImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

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

exports.deleteMany = (filter, session) =>
  Review.deleteMany(filter, session ? { session } : {});

exports.aggregate = (pipeline, session) => {
  const agg = Review.aggregate(pipeline);
  return session ? agg.session(session) : agg;
};
