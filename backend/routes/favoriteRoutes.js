const express = require('express');
const router = express.Router();
const { toggleFavorite, getUserFavorites, getFavoriteStatus } = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:bookId', authMiddleware, toggleFavorite);
router.get('/', authMiddleware, getUserFavorites);
router.get('/:bookId/status', authMiddleware, getFavoriteStatus);

module.exports = router;
