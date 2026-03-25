const express = require('express');
const router = express.Router();
const { toggleFollow, getFollowStatus, getFollowers, getFollowing } = require('../controllers/followController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:userId',            authMiddleware, toggleFollow);
router.get('/:userId/status',      authMiddleware, getFollowStatus);
router.get('/:userId/followers',   getFollowers);
router.get('/:userId/following',   getFollowing);

module.exports = router;
