const express = require('express');
const router = express.Router();
const { deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// DELETE /api/comments/:id
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;
