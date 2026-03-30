const readingListService = require('../services/readingListService');
const catchAsync = require('../utils/catchAsync');

exports.upsertReadingList = catchAsync(async (req, res) => {
  const entry = await readingListService.upsertReadingList(
    req.user.id,
    req.params.bookId,
    req.body.status
  );
  res.json(entry);
});

exports.getUserReadingList = catchAsync(async (req, res) => {
  const list = await readingListService.getUserReadingList(req.user.id);
  res.json(list);
});

exports.removeFromReadingList = catchAsync(async (req, res) => {
  await readingListService.removeFromReadingList(req.user.id, req.params.bookId);
  res.json({ message: 'Removed from reading list' });
});

exports.getReadingListStatus = catchAsync(async (req, res) => {
  const result = await readingListService.getReadingListStatus(req.user.id, req.params.bookId);
  res.json(result);
});
