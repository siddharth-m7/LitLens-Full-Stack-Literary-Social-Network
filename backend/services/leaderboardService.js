const reviewRepo = require('../repositories/reviewRepository');
const { computeBadges } = require('../utils/badgeUtils');
const { TTL, getOrSet } = require('../utils/cache');

exports.getLeaderboard = async (period = 'all_time') => {
  const normalizedPeriod = ['monthly', 'yearly'].includes(period) ? period : 'all_time';
  const cacheKey = `leaderboard:${normalizedPeriod}`;
  return getOrSet(cacheKey, () => _fetchLeaderboard(normalizedPeriod), TTL.LEADERBOARD);
};

async function _fetchLeaderboard(period = 'all_time') {
  const now = new Date();
  let startDate = null;
  let periodLabel = 'All Time';

  if (period === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
    periodLabel = `${now.getFullYear()} (Yearly)`;
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    periodLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  const pipeline = [];

  // Step 1: Filter by date if applicable
  if (startDate) {
    pipeline.push({ $match: { createdAt: { $gte: startDate } } });
  }

  pipeline.push(
    { $group: { _id: '$user', reviewCount: { $sum: 1 } } },
    { $sort: { reviewCount: -1 } },
    { $limit: 25 },

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
        'userDoc.createdAt': 1,
        totalReviewCount: { $ifNull: [{ $arrayElemAt: ['$allTimeReviews.total', 0] }, 0] },
        earlyAdopterRank: { $ifNull: [{ $arrayElemAt: ['$earlyAdopterData.rank', 0] }, 0] },
      },
    }
  );

  const results = await reviewRepo.aggregate(pipeline);

  const leaderboard = results.map((entry, idx) => ({
    rank: idx + 1,
    user: { _id: entry.userDoc._id, name: entry.userDoc.name },
    reviewCount: entry.reviewCount,
    totalReviews: entry.totalReviewCount,
    memberSince: entry.userDoc.createdAt ? new Date(entry.userDoc.createdAt).getFullYear() : null,
    badges: computeBadges({
      reviewCount: entry.totalReviewCount,
      isEarlyAdopter: entry.earlyAdopterRank < 50,
      isTopReviewer: idx < 3,
    }),
  }));

  const totalReviewsInPeriod = results.reduce((acc, curr) => acc + curr.reviewCount, 0);

  return {
    period,
    periodLabel,
    month: periodLabel,
    totalReviewsInPeriod,
    totalReviewers: leaderboard.length,
    leaderboard,
  };
}
