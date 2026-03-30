const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');

exports.getCurrentUser = catchAsync(async (req, res) => {
  const result = await userService.getCurrentUser(req.user.id);
  res.json(result);
});

exports.deleteAccount = catchAsync(async (req, res) => {
  await userService.deleteAccount(req.user.id);
  res.json({ message: 'Account deleted' });
});

exports.getPublicProfile = catchAsync(async (req, res) => {
  const result = await userService.getPublicProfile(req.params.id);
  res.json(result);
});
