const favoriteService = require('../services/favoriteService');

exports.toggleFavorite = async (req, res) => {
  try {
    const result = await favoriteService.toggleFavorite(req.user.id, req.params.bookId);
    res.status(result.favorited ? 201 : 200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    const favorites = await favoriteService.getUserFavorites(req.user.id);
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFavoriteStatus = async (req, res) => {
  try {
    const result = await favoriteService.getFavoriteStatus(req.user.id, req.params.bookId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
