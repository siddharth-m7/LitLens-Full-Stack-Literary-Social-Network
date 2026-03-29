const reviewLikeService = require('../services/reviewLikeService');

exports.toggleLike = async (req, res) => {
  try {
    const result = await reviewLikeService.toggleLike(req.user.id, req.params.reviewId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLikeStatus = async (req, res) => {
  try {
    const result = await reviewLikeService.getLikeStatus(req.user?.id, req.params.reviewId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
