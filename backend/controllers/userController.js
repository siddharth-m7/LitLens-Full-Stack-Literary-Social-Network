const userService = require('../services/userService');

exports.getCurrentUser = async (req, res) => {
  try {
    const result = await userService.getCurrentUser(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await userService.deleteAccount(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const result = await userService.getPublicProfile(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
