const reviewService = require('../services/reviewService');

exports.addReview = async (req, res) => {
  try {
    const review = await reviewService.addReview({
      ...req.body,
      userId: req.user.id,
      bookId: req.params.bookId,
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const result = await reviewService.getMyReviews({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await reviewService.updateReview({
      reviewId: req.params.id,
      userId: req.user.id,
      ...req.body,
    });
    res.json(review);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await reviewService.deleteReview({ reviewId: req.params.id, userId: req.user.id });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
