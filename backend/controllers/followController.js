const Follow = require('../models/Follow');

// Toggle follow / unfollow
exports.toggleFollow = async (req, res) => {
  const followingId = req.params.userId;
  if (followingId === req.user.id) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }
  try {
    const existing = await Follow.findOne({ follower: req.user.id, following: followingId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ following: false });
    }
    await Follow.create({ follower: req.user.id, following: followingId });
    res.status(201).json({ following: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get follow status + counts for a user
exports.getFollowStatus = async (req, res) => {
  try {
    const [existing, followerCount, followingCount] = await Promise.all([
      Follow.findOne({ follower: req.user.id, following: req.params.userId }),
      Follow.countDocuments({ following: req.params.userId }),
      Follow.countDocuments({ follower: req.params.userId }),
    ]);
    res.json({ following: !!existing, followerCount, followingCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a user's followers list
exports.getFollowers = async (req, res) => {
  try {
    const followers = await Follow.find({ following: req.params.userId })
      .populate('follower', 'name')
      .sort({ createdAt: -1 });
    res.json(followers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get who a user is following
exports.getFollowing = async (req, res) => {
  try {
    const following = await Follow.find({ follower: req.params.userId })
      .populate('following', 'name')
      .sort({ createdAt: -1 });
    res.json(following);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
