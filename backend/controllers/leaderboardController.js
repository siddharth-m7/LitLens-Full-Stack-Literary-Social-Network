const leaderboardService = require('../services/leaderboardService');
const catchAsync = require('../utils/catchAsync');

exports.getLeaderboard = catchAsync(async (req, res) => {
  const result = await leaderboardService.getLeaderboard();
  res.json(result);
});
