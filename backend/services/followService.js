const followRepo = require('../repositories/followRepository');

exports.toggleFollow = async (followerId, followingId) => {
  if (followingId === followerId)
    throw Object.assign(new Error('You cannot follow yourself'), { status: 400 });

  const existing = await followRepo.findOne(followerId, followingId);
  if (existing) {
    await existing.deleteOne();
    return { following: false };
  }
  await followRepo.create(followerId, followingId);
  return { following: true };
};

exports.getFollowStatus = async (currentUserId, targetUserId) => {
  const [existing, followerCount, followingCount] = await Promise.all([
    followRepo.findOne(currentUserId, targetUserId),
    followRepo.countFollowers(targetUserId),
    followRepo.countFollowing(targetUserId),
  ]);
  return { following: !!existing, followerCount, followingCount };
};

exports.getFollowers = async (userId) => {
  return followRepo.getFollowers(userId);
};

exports.getFollowing = async (userId) => {
  return followRepo.getFollowing(userId);
};
