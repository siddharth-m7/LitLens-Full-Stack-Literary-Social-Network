const commentRepo = require('../repositories/commentRepository');

exports.addComment = async ({ reviewId, userId, text }) => {
  const comment = await commentRepo.create({ review: reviewId, user: userId, text });
  return comment.populate('user', 'name');
};

exports.getComments = async ({ reviewId, page, limit }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [comments, totalCount] = await Promise.all([
    commentRepo.findByReviewPaginated({ reviewId, skip, limitNum }),
    commentRepo.countByReview(reviewId),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);
  return { comments, totalCount, page: pageNum, limit: limitNum, totalPages, hasNextPage: pageNum < totalPages };
};

exports.deleteComment = async ({ commentId, userId }) => {
  const comment = await commentRepo.findById(commentId);
  if (!comment) throw Object.assign(new Error('Comment not found'), { status: 404 });
  if (comment.user.toString() !== userId)
    throw Object.assign(new Error('Not your comment'), { status: 403 });
  await comment.deleteOne();
};
