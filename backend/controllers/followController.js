const followService = require('../services/followService');
const catchAsync = require('../utils/catchAsync');

exports.toggleFollow = catchAsync(async (req, res) => {
  const result = await followService.toggleFollow(req.user.id, req.params.userId);
  res.status(result.following ? 201 : 200).json(result);
});

exports.getFollowStatus = catchAsync(async (req, res) => {
  const result = await followService.getFollowStatus(req.user.id, req.params.userId);
  res.json(result);
});

exports.getFollowers = catchAsync(async (req, res) => {
  const followers = await followService.getFollowers(req.params.userId);
  res.json(followers);
});

exports.getFollowing = catchAsync(async (req, res) => {
  const following = await followService.getFollowing(req.params.userId);
  res.json(following);
});
