const Favorite = require('../models/Favorite');

// Toggle favorite — adds if not exists, removes if exists
exports.toggleFavorite = async (req, res) => {
  try {
    const existing = await Favorite.findOne({ user: req.user.id, book: req.params.bookId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ favorited: false });
    }
    await Favorite.create({ user: req.user.id, book: req.params.bookId });
    res.status(201).json({ favorited: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all favorites for the logged-in user
exports.getUserFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate('book', 'title author coverImage genre averageRating')
      .sort({ createdAt: -1 });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if a specific book is favorited by the logged-in user
exports.getFavoriteStatus = async (req, res) => {
  try {
    const existing = await Favorite.findOne({ user: req.user.id, book: req.params.bookId });
    res.json({ favorited: !!existing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
