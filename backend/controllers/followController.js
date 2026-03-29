const followService = require('../services/followService');

exports.toggleFollow = async (req, res) => {
  try {
    const result = await followService.toggleFollow(req.user.id, req.params.userId);
    res.status(result.following ? 201 : 200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getFollowStatus = async (req, res) => {
  try {
    const result = await followService.getFollowStatus(req.user.id, req.params.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const followers = await followService.getFollowers(req.params.userId);
    res.json(followers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const following = await followService.getFollowing(req.params.userId);
    res.json(following);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
