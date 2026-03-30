const commentService = require('../services/commentService');
const catchAsync = require('../utils/catchAsync');

exports.addComment = catchAsync(async (req, res) => {
  const comment = await commentService.addComment({
    reviewId: req.params.reviewId,
    userId: req.user.id,
    text: req.body.text,
  });
  res.status(201).json(comment);
});

exports.getComments = catchAsync(async (req, res) => {
  const result = await commentService.getComments({ reviewId: req.params.reviewId, ...req.query });
  res.json(result);
});

exports.deleteComment = catchAsync(async (req, res) => {
  await commentService.deleteComment({ commentId: req.params.id, userId: req.user.id });
  res.json({ message: 'Comment deleted' });
});
