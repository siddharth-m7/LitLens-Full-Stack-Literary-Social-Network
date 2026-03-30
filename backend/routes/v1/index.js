const router = require('express').Router();

const authRoutes = require('../authRoutes');
const bookRoutes = require('../bookRoutes');
const reviewRoutes = require('../reviewRoutes');
const userRoutes = require('../userRoutes');
const pingRoutes = require('../pingRoutes');
const favoriteRoutes = require('../favoriteRoutes');
const readingListRoutes = require('../readingListRoutes');
const followRoutes = require('../followRoutes');
const commentRoutes = require('../commentRoutes');
const leaderboardRoutes = require('../leaderboardRoutes');
const adminRoutes = require('../adminRoutes');

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);
router.use('/ping', pingRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reading-list', readingListRoutes);
router.use('/follow', followRoutes);
router.use('/comments', commentRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
