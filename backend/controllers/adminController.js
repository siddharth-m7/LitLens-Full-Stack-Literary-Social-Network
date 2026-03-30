const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await adminService.getAllUsers();
  res.json(users);
});

exports.toggleBanUser = catchAsync(async (req, res) => {
  const user = await adminService.toggleBanUser(req.params.id, req.user._id);
  res.json(user);
});

exports.promoteUser = catchAsync(async (req, res) => {
  const user = await adminService.promoteUser(req.params.id);
  res.json(user);
});

exports.getAnalytics = catchAsync(async (req, res) => {
  const result = await adminService.getAnalytics();
  res.json(result);
});
