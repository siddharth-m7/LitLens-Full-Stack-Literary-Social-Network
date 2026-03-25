const ReadingList = require('../models/ReadingList');

// Add or update a book's status in the reading list
exports.upsertReadingList = async (req, res) => {
  try {
    const { status } = req.body;
    const entry = await ReadingList.findOneAndUpdate(
      { user: req.user.id, book: req.params.bookId },
      { status },
      { upsert: true, new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get full reading list for the logged-in user
exports.getUserReadingList = async (req, res) => {
  try {
    const list = await ReadingList.find({ user: req.user.id })
      .populate('book', 'title author coverImage genre averageRating')
      .sort({ updatedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove a book from the reading list
exports.removeFromReadingList = async (req, res) => {
  try {
    await ReadingList.deleteOne({ user: req.user.id, book: req.params.bookId });
    res.json({ message: 'Removed from reading list' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reading list status for a single book
exports.getReadingListStatus = async (req, res) => {
  try {
    const entry = await ReadingList.findOne({ user: req.user.id, book: req.params.bookId });
    res.json({ status: entry ? entry.status : null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
