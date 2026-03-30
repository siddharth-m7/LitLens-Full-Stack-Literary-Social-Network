const favoriteService = require('../services/favoriteService');
const catchAsync = require('../utils/catchAsync');

exports.toggleFavorite = catchAsync(async (req, res) => {
  const result = await favoriteService.toggleFavorite(req.user.id, req.params.bookId);
  res.status(result.favorited ? 201 : 200).json(result);
});

exports.getUserFavorites = catchAsync(async (req, res) => {
  const favorites = await favoriteService.getUserFavorites(req.user.id);
  res.json(favorites);
});

exports.getFavoriteStatus = catchAsync(async (req, res) => {
  const result = await favoriteService.getFavoriteStatus(req.user.id, req.params.bookId);
  res.json(result);
});
