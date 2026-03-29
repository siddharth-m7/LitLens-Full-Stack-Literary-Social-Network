const readingListRepo = require('../repositories/readingListRepository');

exports.upsertReadingList = async (userId, bookId, status) => {
  return readingListRepo.upsert(userId, bookId, status);
};

exports.getUserReadingList = async (userId) => {
  return readingListRepo.findByUser(userId);
};

exports.removeFromReadingList = async (userId, bookId) => {
  await readingListRepo.deleteOne(userId, bookId);
};

exports.getReadingListStatus = async (userId, bookId) => {
  const entry = await readingListRepo.findOne(userId, bookId);
  return { status: entry ? entry.status : null };
};
