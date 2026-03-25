const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Like authMiddleware but doesn't reject unauthenticated requests.
// Sets req.user if a valid token is present, otherwise continues with req.user undefined.
const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } catch (err) {
      // invalid/expired token — continue as unauthenticated
    }
  }
  next();
};

module.exports = optionalAuthMiddleware;
