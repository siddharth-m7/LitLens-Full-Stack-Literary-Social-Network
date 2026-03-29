const reviewLikeRepo = require('../repositories/reviewLikeRepository');

exports.toggleLike = async (userId, reviewId) => {
  const existing = await reviewLikeRepo.findOne(userId, reviewId);
  if (existing) {
    await existing.deleteOne();
  } else {
    await reviewLikeRepo.create(userId, reviewId);
  }
  const likeCount = await reviewLikeRepo.count(reviewId);
  return { liked: !existing, likeCount };
};

exports.getLikeStatus = async (userId, reviewId) => {
  const likeCount = await reviewLikeRepo.count(reviewId);
  const liked = userId
    ? !!(await reviewLikeRepo.findOne(userId, reviewId))
    : false;
  return { liked, likeCount };
};
