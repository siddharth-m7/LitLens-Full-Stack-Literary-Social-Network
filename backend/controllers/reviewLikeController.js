const reviewLikeService = require('../services/reviewLikeService');
const catchAsync = require('../utils/catchAsync');

exports.toggleLike = catchAsync(async (req, res) => {
  const result = await reviewLikeService.toggleLike(req.user.id, req.params.reviewId);
  res.json(result);
});

exports.getLikeStatus = catchAsync(async (req, res) => {
  const result = await reviewLikeService.getLikeStatus(req.user?.id, req.params.reviewId);
  res.json(result);
});
