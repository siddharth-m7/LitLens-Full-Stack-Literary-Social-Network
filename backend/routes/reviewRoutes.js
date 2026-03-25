const express = require('express');
const router = express.Router();
const { addReview, getMyReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const { toggleLike, getLikeStatus } = require('../controllers/reviewLikeController');
const { addComment, getComments } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const { validateReview, handleValidation } = require('../middleware/validators');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Book reviews, likes, and comments
 */

/**
 * @swagger
 * /reviews/my:
 *   get:
 *     summary: Get the current user's reviews (paginated)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of user's reviews
 *       401:
 *         description: Unauthorized
 */
router.get('/my', authMiddleware, getMyReviews);

/**
 * @swagger
 * /reviews/{bookId}:
 *   post:
 *     summary: Add a review for a book
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Review added
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/:bookId', authMiddleware, validateReview, handleValidation, addReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update your review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not your review
 *       404:
 *         description: Review not found
 */
router.put('/:id', authMiddleware, validateReview, handleValidation, updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete your review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not your review
 */
router.delete('/:id', authMiddleware, deleteReview);

/**
 * @swagger
 * /reviews/{reviewId}/like:
 *   post:
 *     summary: Toggle like on a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like toggled
 *       401:
 *         description: Unauthorized
 */
router.post('/:reviewId/like', authMiddleware, toggleLike);

/**
 * @swagger
 * /reviews/{reviewId}/like/status:
 *   get:
 *     summary: Get like status for a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like status
 */
router.get('/:reviewId/like/status', optionalAuthMiddleware, getLikeStatus);

/**
 * @swagger
 * /reviews/{reviewId}/comments:
 *   post:
 *     summary: Add a comment to a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *       401:
 *         description: Unauthorized
 */
router.post('/:reviewId/comments', authMiddleware, addComment);

/**
 * @swagger
 * /reviews/{reviewId}/comments:
 *   get:
 *     summary: Get comments for a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/:reviewId/comments', getComments);

module.exports = router;
