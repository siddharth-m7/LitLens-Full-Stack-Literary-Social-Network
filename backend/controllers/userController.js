const User = require('../models/User');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const ReadingList = require('../models/ReadingList');
const Follow = require('../models/Follow');
const Comment = require('../models/Comment');
const ReviewLike = require('../models/ReviewLike');
const Book = require('../models/Book');
const { computeBadges, computeMilestones } = require('../utils/badgeUtils');

// Helper: check if userId is in the top 10 reviewers for the current month
async function getTopReviewerIds() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const results = await Review.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  return results.map(r => r._id.toString());
}

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [reviewCount, earlyAdopterRank, topIds, followerCount, followingCount] = await Promise.all([
      Review.countDocuments({ user: user._id }),
      User.countDocuments({ createdAt: { $lt: user.createdAt } }),
      getTopReviewerIds(),
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
    ]);

    const badges = computeBadges({
      reviewCount,
      isEarlyAdopter: earlyAdopterRank < 50,
      isTopReviewer: topIds.includes(user._id.toString()),
    });
    const milestones = computeMilestones(reviewCount);

    res.json({ ...user.toObject(), reviewCount, followerCount, followingCount, badges, milestones });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;
  try {
    // Collect books that had reviews from this user (for rating recalc)
    const userReviews = await Review.find({ user: userId }).select('book').lean();
    const affectedBookIds = [...new Set(userReviews.map(r => r.book?.toString()).filter(Boolean))];

    // Delete all user data in parallel
    await Promise.all([
      User.findByIdAndDelete(userId),
      Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
      Review.deleteMany({ user: userId }),
      Favorite.deleteMany({ user: userId }),
      ReadingList.deleteMany({ user: userId }),
      Comment.deleteMany({ user: userId }),
      ReviewLike.deleteMany({ user: userId }),
    ]);

    // Recalculate averageRating for affected books
    if (affectedBookIds.length > 0) {
      const ratings = await Review.aggregate([
        { $match: { book: { $in: affectedBookIds.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) } } },
        { $group: { _id: '$book', avg: { $avg: '$rating' } } },
      ]);
      const ratingMap = Object.fromEntries(ratings.map(r => [r._id.toString(), r.avg]));

      const bulkOps = affectedBookIds.map(id => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { averageRating: ratingMap[id] != null ? Math.round(ratingMap[id] * 10) / 10 : null } },
        },
      }));
      await Book.bulkWrite(bulkOps);
    }

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public profile — no auth required
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [reviews, favorites, readingList, followerCount, followingCount, reviewCount, earlyAdopterRank, topIds] = await Promise.all([
      Review.find({ user: req.params.id })
        .populate('book', 'title author coverImage')
        .sort({ createdAt: -1 }),
      Favorite.find({ user: req.params.id })
        .populate('book', 'title author coverImage genre averageRating'),
      ReadingList.find({ user: req.params.id })
        .populate('book', 'title author coverImage'),
      Follow.countDocuments({ following: req.params.id }),
      Follow.countDocuments({ follower: req.params.id }),
      Review.countDocuments({ user: req.params.id }),
      User.countDocuments({ createdAt: { $lt: user.createdAt } }),
      getTopReviewerIds(),
    ]);

    const badges = computeBadges({
      reviewCount,
      isEarlyAdopter: earlyAdopterRank < 50,
      isTopReviewer: topIds.includes(user._id.toString()),
    });
    const milestones = computeMilestones(reviewCount);

    res.json({ user, reviews, favorites, readingList, followerCount, followingCount, badges, milestones });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
