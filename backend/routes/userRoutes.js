const express = require('express');
const router = express.Router();
const { getCurrentUser, getPublicProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, getCurrentUser);
router.get('/:id', getPublicProfile); // public

module.exports = router;
