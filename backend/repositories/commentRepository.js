const Comment = require('../models/Comment');

exports.create = (data) => Comment.create(data);

exports.findByReview = (reviewId) =>
  Comment.find({ review: reviewId })
    .populate('user', 'name')
    .sort({ createdAt: 1 });

exports.findByReviewPaginated = ({ reviewId, skip, limitNum }) =>
  Comment.find({ review: reviewId })
    .populate('user', 'name')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limitNum);

exports.countByReview = (reviewId) => Comment.countDocuments({ review: reviewId });

exports.findById = (id) => Comment.findById(id);

exports.deleteMany = (filter, session) =>
  Comment.deleteMany(filter, session ? { session } : {});
