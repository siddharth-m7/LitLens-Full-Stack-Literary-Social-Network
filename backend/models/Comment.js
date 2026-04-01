const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  text:   { type: String, required: true, trim: true },
}, { timestamps: true });

commentSchema.index({ review: 1 });
// Covers cascade deleteMany({ user: userId }) on account deletion
commentSchema.index({ user: 1 });

module.exports = mongoose.model('Comment', commentSchema);
