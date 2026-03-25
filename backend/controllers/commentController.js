const Comment = require('../models/Comment');

// Add a comment to a review
exports.addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      review: req.params.reviewId,
      user: req.user.id,
      text: req.body.text,
    });
    const populated = await comment.populate('user', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all comments for a review
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ review: req.params.reviewId })
      .populate('user', 'name')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete own comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not your comment' });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
