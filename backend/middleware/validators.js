const { body, validationResult } = require('express-validator');

const GENRES = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Fantasy',
  'Romance', 'Thriller', 'Biography', 'Self-Help', 'Historical Fiction',
  'Horror', 'Poetry', 'Other'
];

// Middleware to run after validation rules — returns 422 with error list if any
exports.handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Auth validators
exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Book validators
exports.validateBook = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('genre')
    .optional({ checkFalsy: true })
    .isIn(GENRES)
    .withMessage(`Genre must be one of: ${GENRES.join(', ')}`),
  body('coverImage')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Cover image must be a valid URL'),
];

// Review validators
exports.validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 })
    .withMessage('Comment must be at most 2000 characters'),
];

// Password reset validators
exports.validateForgotPassword = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
];

exports.validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
