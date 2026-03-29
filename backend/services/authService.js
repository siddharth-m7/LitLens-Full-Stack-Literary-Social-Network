const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mailer = require('../config/mailer');
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

exports.forgotPassword = async (email) => {
  const user = await userRepo.findByEmail(email);
  if (!user) return; // silent — prevents email enumeration

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  logger.info({ userId: user._id, email: user.email }, 'Password reset email sent');

  await mailer.sendMail({
    from: process.env.SMTP_FROM || `"Book Review App" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Reset Your Password</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your Book Review App account.</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(to right, #4f46e5, #7c3aed); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email. Your password won't change.</p>
        <p style="color: #666; font-size: 12px;">Or copy and paste this link: <a href="${resetUrl}">${resetUrl}</a></p>
      </div>
    `,
  });
};

exports.resetPassword = async ({ token, password }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userRepo.findByResetToken(hashedToken);
  if (!user) throw Object.assign(new Error('Reset token is invalid or has expired.'), { status: 400 });

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  user.refreshToken = null; // invalidate all sessions
  await user.save();

  logger.info({ userId: user._id }, 'Password reset successfully');
};
