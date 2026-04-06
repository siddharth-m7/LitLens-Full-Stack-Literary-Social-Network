const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  banned: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
}, { timestamps: true });

// Early adopter rank: countDocuments({ createdAt: { $lt: user.createdAt } })
userSchema.index({ createdAt: 1 });

module.exports = mongoose.model('User', userSchema);
