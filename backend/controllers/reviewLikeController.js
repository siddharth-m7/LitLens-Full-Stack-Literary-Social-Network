const ReviewLike = require('../models/ReviewLike');

// Toggle like on a review
exports.toggleLike = async (req, res) => {
  try {
    const existing = await ReviewLike.findOne({ user: req.user.id, review: req.params.reviewId });
    if (existing) {
      await existing.deleteOne();
    } else {
      await ReviewLike.create({ user: req.user.id, review: req.params.reviewId });
    }
    const likeCount = await ReviewLike.countDocuments({ review: req.params.reviewId });
    res.json({ liked: !existing, likeCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get like status + count for a review (works for unauthenticated users too)
exports.getLikeStatus = async (req, res) => {
  try {
    const likeCount = await ReviewLike.countDocuments({ review: req.params.reviewId });
    // req.user may be undefined if not authenticated
    const liked = req.user
      ? !!(await ReviewLike.findOne({ user: req.user.id, review: req.params.reviewId }))
      : false;
    res.json({ liked, likeCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
