const userRepo = require('../repositories/userRepository');
const bookRepo = require('../repositories/bookRepository');
const reviewRepo = require('../repositories/reviewRepository');

exports.getAllUsers = async () => {
  return userRepo.findAll();
};

exports.toggleBanUser = async (targetId, currentUserId) => {
  const user = await userRepo.findByIdExcludePassword(targetId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  if (user._id.toString() === currentUserId.toString())
    throw Object.assign(new Error('Cannot ban yourself'), { status: 400 });

  user.banned = !user.banned;
  await user.save();
  return user;
};

exports.promoteUser = async (targetId) => {
  const user = await userRepo.findByIdExcludePassword(targetId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  user.role = 'admin';
  await user.save();
  return user;
};

exports.getAnalytics = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalBooks,
    totalReviews,
    totalUsers,
    avgRatingResult,
    reviewsPerDay,
    topBooks,
    signupsPerDay,
  ] = await Promise.all([
    bookRepo.countDocuments({}),
    reviewRepo.countDocuments({}),
    userRepo.countDocuments({}),
    bookRepo.aggregate([
      { $match: { averageRating: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$averageRating' } } },
    ]),
    reviewRepo.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    reviewRepo.aggregate([
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $project: { _id: 0, title: '$book.title', count: 1 } },
    ]),
    userRepo.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const fillDays = (data) => {
    const map = {};
    data.forEach((d) => { map[d._id] = d.count; });
    const result = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map[key] || 0 });
    }
    return result;
  };

  return {
    totals: {
      books: totalBooks,
      reviews: totalReviews,
      users: totalUsers,
      avgRating:
        avgRatingResult[0]?.avg != null
          ? parseFloat(avgRatingResult[0].avg.toFixed(2))
          : null,
    },
    reviewsPerDay: fillDays(reviewsPerDay),
    topBooks,
    signupsPerDay: fillDays(signupsPerDay),
  };
};
