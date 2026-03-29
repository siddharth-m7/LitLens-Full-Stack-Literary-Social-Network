const logger = require('../config/logger');
const reviewRepo = require('../repositories/reviewRepository');
const bookRepo = require('../repositories/bookRepository');

async function recalculateAverageRating(bookId) {
  const reviews = await reviewRepo.findByBook(bookId);
  const newAvg = reviews.length
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : null;
  await bookRepo.findByIdAndUpdate(bookId, { averageRating: newAvg });
}

exports.addReview = async ({ rating, comment, tags, pros, cons, imageUrl, userId, bookId }) => {
  const review = await reviewRepo.create({
    rating,
    comment,
    tags: tags || [],
    pros: pros || [],
    cons: cons || [],
    imageUrl: imageUrl || '',
    user: userId,
    book: bookId,
  });
  await recalculateAverageRating(bookId);
  logger.info({ reviewId: review._id, userId, bookId }, 'Review added');
  return review;
};

exports.getMyReviews = async ({ userId, userName, userEmail, page, limit }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, totalCount] = await Promise.all([
    reviewRepo.findByUser({ userId, skip, limitNum }),
    reviewRepo.countByUser(userId),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);
  return {
    user: { name: userName, email: userEmail, _id: userId },
    reviews,
    totalCount,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
  };
};

exports.updateReview = async ({ reviewId, userId, rating, comment, tags, pros, cons, imageUrl }) => {
  const review = await reviewRepo.findById(reviewId);
  if (!review) throw Object.assign(new Error('Review not found'), { status: 404 });
  if (review.user.toString() !== userId)
    throw Object.assign(new Error('Not your review'), { status: 403 });

  review.rating = rating ?? review.rating;
  review.comment = comment ?? review.comment;
  if (tags !== undefined) review.tags = tags;
  if (pros !== undefined) review.pros = pros;
  if (cons !== undefined) review.cons = cons;
  if (imageUrl !== undefined) review.imageUrl = imageUrl;
  await review.save();

  await recalculateAverageRating(review.book);
  return review;
};

exports.deleteReview = async ({ reviewId, userId }) => {
  const review = await reviewRepo.findById(reviewId);
  if (!review) throw Object.assign(new Error('Review not found'), { status: 404 });
  if (review.user.toString() !== userId)
    throw Object.assign(new Error('Not your review'), { status: 403 });

  const bookId = review.book;
  await review.deleteOne();
  await recalculateAverageRating(bookId);
  logger.info({ reviewId, userId, bookId }, 'Review deleted');
};

exports.recalculateAverageRating = recalculateAverageRating;
