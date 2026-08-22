const Follow = require('../models/Follow');

exports.findOne = (followerId, followingId) =>
  Follow.findOne({ follower: followerId, following: followingId });

exports.create = (followerId, followingId) =>
  Follow.create({ follower: followerId, following: followingId });

exports.countFollowers = (userId) => Follow.countDocuments({ following: userId });

exports.countFollowing = (userId) => Follow.countDocuments({ follower: userId });

exports.getFollowers = (userId) =>
  Follow.find({ following: userId })
    .populate('follower', 'name email')
    .sort({ createdAt: -1 });

exports.getFollowing = (userId) =>
  Follow.find({ follower: userId })
    .populate('following', 'name email')
    .sort({ createdAt: -1 });

exports.deleteMany = (filter, session) =>
  Follow.deleteMany(filter, session ? { session } : {});
