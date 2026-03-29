const adminService = require('../services/adminService');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBanUser = async (req, res) => {
  try {
    const user = await adminService.toggleBanUser(req.params.id, req.user._id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.promoteUser = async (req, res) => {
  try {
    const user = await adminService.promoteUser(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const result = await adminService.getAnalytics();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
