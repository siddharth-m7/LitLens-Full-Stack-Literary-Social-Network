const mongoose = require('mongoose');
const logger = require('../config/logger');
const userRepo = require('../repositories/userRepository');
const reviewRepo = require('../repositories/reviewRepository');
const favoriteRepo = require('../repositories/favoriteRepository');
const readingListRepo = require('../repositories/readingListRepository');
const followRepo = require('../repositories/followRepository');
const commentRepo = require('../repositories/commentRepository');
const reviewLikeRepo = require('../repositories/reviewLikeRepository');
const bookRepo = require('../repositories/bookRepository');
const { computeBadges, computeMilestones } = require('../utils/badgeUtils');

async function getTopReviewerIds() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const results = await reviewRepo.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  return results.map((r) => r._id.toString());
}

exports.getCurrentUser = async (userId) => {
  const user = await userRepo.findByIdExcludePassword(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [reviewCount, earlyAdopterRank, topIds, followerCount, followingCount] = await Promise.all([
    reviewRepo.countByUser(userId),
    userRepo.countDocuments({ createdAt: { $lt: user.createdAt } }),
    getTopReviewerIds(),
    followRepo.countFollowers(userId),
    followRepo.countFollowing(userId),
  ]);

  const badges = computeBadges({
    reviewCount,
    isEarlyAdopter: earlyAdopterRank < 50,
    isTopReviewer: topIds.includes(user._id.toString()),
  });
  const milestones = computeMilestones(reviewCount);

  return { ...user.toObject(), reviewCount, followerCount, followingCount, badges, milestones };
};

exports.deleteAccount = async (userId) => {
  const userReviews = await reviewRepo.findByUserSelectBook(userId);
  const affectedBookIds = [...new Set(userReviews.map((r) => r.book?.toString()).filter(Boolean))];

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await userRepo.findByIdAndDelete(userId, session);
    await followRepo.deleteMany({ $or: [{ follower: userId }, { following: userId }] }, session);
    await reviewRepo.deleteMany({ user: userId }, session);
    await favoriteRepo.deleteMany({ user: userId }, session);
    await readingListRepo.deleteMany({ user: userId }, session);
    await commentRepo.deleteMany({ user: userId }, session);
    await reviewLikeRepo.deleteMany({ user: userId }, session);

    if (affectedBookIds.length > 0) {
      const ratings = await reviewRepo.aggregate(
        [
          {
            $match: {
              book: {
                $in: affectedBookIds.map((id) => mongoose.Types.ObjectId.createFromHexString(id)),
              },
            },
          },
          { $group: { _id: '$book', avg: { $avg: '$rating' } } },
        ],
        session
      );
      const ratingMap = Object.fromEntries(ratings.map((r) => [r._id.toString(), r.avg]));

      const bulkOps = affectedBookIds.map((id) => ({
        updateOne: {
          filter: { _id: id },
          update: {
            $set: {
              averageRating:
                ratingMap[id] != null ? Math.round(ratingMap[id] * 10) / 10 : null,
            },
          },
        },
      }));
      await bookRepo.bulkWrite(bulkOps, session);
    }

    await session.commitTransaction();
    logger.info({ userId, affectedBooks: affectedBookIds.length }, 'Account deleted');
  } catch (err) {
    await session.abortTransaction();
    logger.error({ userId, err: err.message }, 'deleteAccount transaction aborted');
    throw err;
  } finally {
    session.endSession();
  }
};

exports.getPublicProfile = async (userId) => {
  const user = await userRepo.findByIdExcludePasswordEmail(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [
    favorites,
    readingList,
    followerCount,
    followingCount,
    reviewCount,
    earlyAdopterRank,
    topIds,
  ] = await Promise.all([
    favoriteRepo.findByUser(userId),
    readingListRepo.findByUser(userId),
    followRepo.countFollowers(userId),
    followRepo.countFollowing(userId),
    reviewRepo.countByUser(userId),
    userRepo.countDocuments({ createdAt: { $lt: user.createdAt } }),
    getTopReviewerIds(),
  ]);

  const badges = computeBadges({
    reviewCount,
    isEarlyAdopter: earlyAdopterRank < 50,
    isTopReviewer: topIds.includes(user._id.toString()),
  });
  const milestones = computeMilestones(reviewCount);

  return { user, favorites, readingList, followerCount, followingCount, reviewCount, badges, milestones };
};
