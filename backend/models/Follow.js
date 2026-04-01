const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

followSchema.index({ follower: 1, following: 1 }, { unique: true });
// Covers countFollowers({ following: userId }) and getFollowers — not covered by compound prefix
followSchema.index({ following: 1 });

module.exports = mongoose.model('Follow', followSchema);
