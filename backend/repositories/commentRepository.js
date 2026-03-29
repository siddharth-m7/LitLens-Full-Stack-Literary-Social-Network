const Comment = require('../models/Comment');

exports.create = (data) => Comment.create(data);

exports.findByReview = (reviewId) =>
  Comment.find({ review: reviewId })
    .populate('user', 'name')
    .sort({ createdAt: 1 });

exports.findById = (id) => Comment.findById(id);

exports.deleteMany = (filter) => Comment.deleteMany(filter);
