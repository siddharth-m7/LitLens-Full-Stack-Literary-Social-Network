const reviewService = require('../services/reviewService');
const catchAsync = require('../utils/catchAsync');

exports.getBookReviews = catchAsync(async (req, res) => {
  const result = await reviewService.getBookReviews({ bookId: req.params.id, ...req.query });
  res.json(result);
});

exports.getPublicUserReviews = catchAsync(async (req, res) => {
  const result = await reviewService.getPublicUserReviews({ userId: req.params.id, ...req.query });
  res.json(result);
});

exports.addReview = catchAsync(async (req, res) => {
  const review = await reviewService.addReview({
    ...req.body,
    userId: req.user.id,
    bookId: req.params.bookId,
  });
  res.status(201).json(review);
});

exports.getMyReviews = catchAsync(async (req, res) => {
  const result = await reviewService.getMyReviews({
    userId: req.user._id,
    userName: req.user.name,
    userEmail: req.user.email,
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json(result);
});

exports.updateReview = catchAsync(async (req, res) => {
  const review = await reviewService.updateReview({
    reviewId: req.params.id,
    userId: req.user.id,
    ...req.body,
  });
  res.json(review);
});

exports.deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview({ reviewId: req.params.id, userId: req.user.id });
  res.json({ message: 'Review deleted' });
});
