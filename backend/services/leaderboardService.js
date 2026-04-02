const reviewRepo = require('../repositories/reviewRepository');
const { computeBadges } = require('../utils/badgeUtils');
const { TTL, getOrSet, LEADERBOARD_KEY } = require('../utils/cache');

exports.getLeaderboard = async () => {
  return getOrSet(LEADERBOARD_KEY, () => _fetchLeaderboard(), TTL.LEADERBOARD);
};

async function _fetchLeaderboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const results = await reviewRepo.aggregate([
    // Step 1: reviews written this month
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$user', reviewCount: { $sum: 1 } } },
    { $sort: { reviewCount: -1 } },
    { $limit: 10 },

    // Step 2: join user doc
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: '$userDoc' },

    // Step 3: all-time review count per user (for Book Worm badge)
    {
      $lookup: {
        from: 'reviews',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
          { $count: 'total' },
        ],
        as: 'allTimeReviews',
      },
    },

    // Step 4: early adopter rank — count users created before this user
    {
      $lookup: {
        from: 'users',
        let: { createdAt: '$userDoc.createdAt' },
        pipeline: [
          { $match: { $expr: { $lt: ['$createdAt', '$$createdAt'] } } },
          { $count: 'rank' },
        ],
        as: 'earlyAdopterData',
      },
    },

    {
      $project: {
        reviewCount: 1,
        'userDoc._id': 1,
        'userDoc.name': 1,
        totalReviewCount: { $ifNull: [{ $arrayElemAt: ['$allTimeReviews.total', 0] }, 0] },
        earlyAdopterRank: { $ifNull: [{ $arrayElemAt: ['$earlyAdopterData.rank', 0] }, 0] },
      },
    },
  ]);

  const leaderboard = results.map((entry, idx) => ({
    rank: idx + 1,
    user: { _id: entry.userDoc._id, name: entry.userDoc.name },
    reviewCount: entry.reviewCount,
    badges: computeBadges({
      reviewCount: entry.totalReviewCount,
      isEarlyAdopter: entry.earlyAdopterRank < 50,
      isTopReviewer: true,
    }),
  }));

  return {
    month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    leaderboard,
  };
}
