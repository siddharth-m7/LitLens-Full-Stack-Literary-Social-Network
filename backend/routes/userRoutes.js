const express = require('express');
const router = express.Router();
const { getCurrentUser, getPublicProfile, deleteAccount } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, getCurrentUser);
router.delete('/me', authMiddleware, deleteAccount);
router.get('/:id', getPublicProfile); // public

module.exports = router;
