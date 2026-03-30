const ReviewLike = require('../models/ReviewLike');

exports.findOne = (userId, reviewId) =>
  ReviewLike.findOne({ user: userId, review: reviewId });

exports.create = (userId, reviewId) =>
  ReviewLike.create({ user: userId, review: reviewId });

exports.count = (reviewId) => ReviewLike.countDocuments({ review: reviewId });

exports.deleteMany = (filter, session) =>
  ReviewLike.deleteMany(filter, session ? { session } : {});
