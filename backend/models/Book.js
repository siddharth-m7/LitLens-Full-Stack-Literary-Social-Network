const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String,
  description: String,
  genre: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  averageRating: { type: Number, default: null },
  reviewCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// ✅ Add virtual populate for reviews
bookSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'book'
});

// Default sort (newest first)
bookSchema.index({ createdAt: -1 });
// Rating-based sort and minRating filter; sparse because averageRating can be null
bookSchema.index({ averageRating: -1 }, { sparse: true });

module.exports = mongoose.model('Book', bookSchema);
