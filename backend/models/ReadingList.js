const mongoose = require('mongoose');

const readingListSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  status: {
    type: String,
    enum: ['want_to_read', 'reading', 'finished'],
    required: true,
  },
}, { timestamps: true });

readingListSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('ReadingList', readingListSchema);
