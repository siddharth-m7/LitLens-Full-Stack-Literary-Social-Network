const express = require('express');
const router = express.Router();
const {
  upsertReadingList,
  getUserReadingList,
  removeFromReadingList,
  getReadingListStatus,
} = require('../controllers/readingListController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:bookId', authMiddleware, upsertReadingList);
router.get('/', authMiddleware, getUserReadingList);
router.delete('/:bookId', authMiddleware, removeFromReadingList);
router.get('/:bookId/status', authMiddleware, getReadingListStatus);

module.exports = router;
