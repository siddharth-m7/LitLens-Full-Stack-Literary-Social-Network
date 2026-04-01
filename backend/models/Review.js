const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  tags: [{ type: String }],
  pros: [{ type: String }],
  cons: [{ type: String }],
  imageUrl: { type: String, default: '' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }
}, { timestamps: true });

// Covers findByBook, findByBookPaginated, countByBook (sorted)
reviewSchema.index({ book: 1, createdAt: -1 });
// Covers findByUser, countByUser, findByUserSelectBook, cascade deleteMany({ user })
reviewSchema.index({ user: 1 });
// Covers leaderboard monthly $match: { createdAt: { $gte: startOfMonth } }
reviewSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Review', reviewSchema);
