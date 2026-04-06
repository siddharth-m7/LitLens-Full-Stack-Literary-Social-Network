const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');
const logger = require('../config/logger');

function generateTokens(userId, role) {
  const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

exports.register = async ({ name, email, password }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw Object.assign(new Error('User already exists'), { status: 400 });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepo.create({ name, email, password: hashedPassword });

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = refreshToken;
  await user.save();

  logger.info({ userId: user._id, email: user.email }, 'User registered');

  return {
    token: accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

exports.login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    logger.warn({ email }, 'Login attempt with unknown email');
    throw Object.assign(new Error('Invalid credentials'), { status: 400 });
  }
  if (user.banned) {
    logger.warn({ userId: user._id, email }, 'Login attempt by banned user');
    throw Object.assign(new Error('Your account has been banned.'), { status: 403 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn({ userId: user._id, email }, 'Login attempt with wrong password');
    throw Object.assign(new Error('Invalid credentials'), { status: 400 });
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = refreshToken;
  await user.save();

  logger.info({ userId: user._id, email }, 'User logged in');

  return {
    token: accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

exports.getProfile = async (userId) => {
  return userRepo.findByIdExcludePassword(userId);
};

exports.refresh = async (refreshToken) => {
  if (!refreshToken) throw Object.assign(new Error('Refresh token required'), { status: 401 });

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 403 });
  }

  const user = await userRepo.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken)
    throw Object.assign(new Error('Invalid refresh token'), { status: 403 });
  if (user.banned)
    throw Object.assign(new Error('Your account has been banned.'), { status: 403 });

  const newAccessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return { token: newAccessToken };
};

exports.logout = async (userId) => {
  await userRepo.findByIdAndUpdate(userId, { refreshToken: null });
};
