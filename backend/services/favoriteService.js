const favoriteRepo = require('../repositories/favoriteRepository');

exports.toggleFavorite = async (userId, bookId) => {
  const existing = await favoriteRepo.findOne(userId, bookId);
  if (existing) {
    await existing.deleteOne();
    return { favorited: false };
  }
  await favoriteRepo.create(userId, bookId);
  return { favorited: true };
};

exports.getUserFavorites = async (userId) => {
  return favoriteRepo.findByUser(userId);
};

exports.getFavoriteStatus = async (userId, bookId) => {
  const existing = await favoriteRepo.findOne(userId, bookId);
  return { favorited: !!existing };
};
