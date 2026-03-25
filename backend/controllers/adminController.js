const User = require('../models/User');
const Book = require('../models/Book');
const Review = require('../models/Review');

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:id/ban
exports.toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot ban yourself' });
    }
    user.banned = !user.banned;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:id/promote
exports.promoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = 'admin';
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
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
      Book.countDocuments(),
      Review.countDocuments(),
      User.countDocuments(),

      // Average rating across all books that have been rated
      Book.aggregate([
        { $match: { averageRating: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$averageRating' } } },
      ]),

      // Reviews per day — last 30 days
      Review.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 books by review count
      Review.aggregate([
        { $group: { _id: '$book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: '$book' },
        { $project: { _id: 0, title: '$book.title', count: 1 } },
      ]),

      // User signups per day — last 30 days
      User.aggregate([
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

    // Fill in missing days so charts are continuous
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

    res.json({
      totals: {
        books: totalBooks,
        reviews: totalReviews,
        users: totalUsers,
        avgRating: avgRatingResult[0]?.avg != null
          ? parseFloat(avgRatingResult[0].avg.toFixed(2))
          : null,
      },
      reviewsPerDay: fillDays(reviewsPerDay),
      topBooks,
      signupsPerDay: fillDays(signupsPerDay),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
