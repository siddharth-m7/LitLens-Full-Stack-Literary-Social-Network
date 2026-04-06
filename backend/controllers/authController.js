const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

exports.register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

exports.login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

exports.getProfile = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json(user);
});

exports.refresh = catchAsync(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.json(result);
});

exports.logout = catchAsync(async (req, res) => {
  await authService.logout(req.user._id);
  res.json({ message: 'Logged out successfully' });
});

