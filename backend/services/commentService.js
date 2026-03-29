const commentRepo = require('../repositories/commentRepository');

exports.addComment = async ({ reviewId, userId, text }) => {
  const comment = await commentRepo.create({ review: reviewId, user: userId, text });
  return comment.populate('user', 'name');
};

exports.getComments = async (reviewId) => {
  return commentRepo.findByReview(reviewId);
};

exports.deleteComment = async ({ commentId, userId }) => {
  const comment = await commentRepo.findById(commentId);
  if (!comment) throw Object.assign(new Error('Comment not found'), { status: 404 });
  if (comment.user.toString() !== userId)
    throw Object.assign(new Error('Not your comment'), { status: 403 });
  await comment.deleteOne();
};
