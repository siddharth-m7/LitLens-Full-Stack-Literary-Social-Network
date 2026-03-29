const reviewRepo = require('../repositories/reviewRepository');
const userRepo = require('../repositories/userRepository');
const { computeBadges } = require('../utils/badgeUtils');

exports.getLeaderboard = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const results = await reviewRepo.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$user', reviewCount: { $sum: 1 } } },
    { $sort: { reviewCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: '$userDoc' },
    {
      $project: {
        reviewCount: 1,
        'userDoc._id': 1,
        'userDoc.name': 1,
        'userDoc.createdAt': 1,
      },
    },
  ]);

  const topUserIds = results.map((r) => r.userDoc._id);

  const [totalCounts, userRanks] = await Promise.all([
    reviewRepo.aggregate([
      { $match: { user: { $in: topUserIds } } },
      { $group: { _id: '$user', total: { $sum: 1 } } },
    ]),
    Promise.all(
      results.map((r) =>
        userRepo.countDocuments({ createdAt: { $lt: r.userDoc.createdAt } })
      )
    ),
  ]);

  const totalCountMap = {};
  totalCounts.forEach(({ _id, total }) => { totalCountMap[_id.toString()] = total; });

  const leaderboard = results.map((entry, idx) => {
    const uid = entry.userDoc._id.toString();
    const totalReviewCount = totalCountMap[uid] || 0;
    const isEarlyAdopter = userRanks[idx] < 50;
    const badges = computeBadges({
      reviewCount: totalReviewCount,
      isEarlyAdopter,
      isTopReviewer: true,
    });

    return {
      rank: idx + 1,
      user: { _id: entry.userDoc._id, name: entry.userDoc.name },
      reviewCount: entry.reviewCount,
      badges,
    };
  });

  return {
    month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    leaderboard,
  };
};
