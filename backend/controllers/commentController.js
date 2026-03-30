const commentService = require('../services/commentService');

exports.addComment = async (req, res) => {
  try {
    const comment = await commentService.addComment({
      reviewId: req.params.reviewId,
      userId: req.user.id,
      text: req.body.text,
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const result = await commentService.getComments({ reviewId: req.params.reviewId, ...req.query });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    await commentService.deleteComment({ commentId: req.params.id, userId: req.user.id });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
