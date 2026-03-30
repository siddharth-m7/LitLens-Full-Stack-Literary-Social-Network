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

exports.forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

exports.resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ message: 'Password reset successfully. Please log in with your new password.' });
});
