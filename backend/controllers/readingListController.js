const readingListService = require('../services/readingListService');

exports.upsertReadingList = async (req, res) => {
  try {
    const entry = await readingListService.upsertReadingList(
      req.user.id,
      req.params.bookId,
      req.body.status
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserReadingList = async (req, res) => {
  try {
    const list = await readingListService.getUserReadingList(req.user.id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromReadingList = async (req, res) => {
  try {
    await readingListService.removeFromReadingList(req.user.id, req.params.bookId);
    res.json({ message: 'Removed from reading list' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReadingListStatus = async (req, res) => {
  try {
    const result = await readingListService.getReadingListStatus(req.user.id, req.params.bookId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
