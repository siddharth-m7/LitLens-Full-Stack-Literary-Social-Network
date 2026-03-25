const Book = require('../models/Book');
const Review = require('../models/Review');

// Add review
exports.addReview = async (req, res) => {
  const { rating, comment, tags, pros, cons, imageUrl } = req.body;
  const bookId = req.params.bookId;

  try {
    // Save the review
    const review = await Review.create({
      rating,
      comment,
      tags: tags || [],
      pros: pros || [],
      cons: cons || [],
      imageUrl: imageUrl || '',
      user: req.user.id,
      book: bookId
    });

    // Recalculate average rating
    const reviews = await Review.find({ book: bookId });
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Book.findByIdAndUpdate(bookId, { averageRating: parseFloat(average.toFixed(1)) });

    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getMyReviews = async (req, res) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, totalCount] = await Promise.all([
      Review.find({ user: req.user._id })
        .populate('book', 'title author')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ user: req.user._id }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        _id: req.user._id,
      },
      reviews,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReview = async (req, res) => {
  const { rating, comment, tags, pros, cons, imageUrl } = req.body;

  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not your review' });

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    if (tags !== undefined) review.tags = tags;
    if (pros !== undefined) review.pros = pros;
    if (cons !== undefined) review.cons = cons;
    if (imageUrl !== undefined) review.imageUrl = imageUrl;
    await review.save();

    // Update book average
    const reviews = await Review.find({ book: review.book });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Book.findByIdAndUpdate(review.book, { averageRating: parseFloat(avg.toFixed(1)) });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not your review' });

    await review.deleteOne();

    // Update average rating (null when no reviews remain)
    const reviews = await Review.find({ book: review.book });
    const newAvg = reviews.length
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : null;

    await Book.findByIdAndUpdate(review.book, { averageRating: newAvg });

    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

