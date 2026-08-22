const leaderboardService = require('../services/leaderboardService');
const catchAsync = require('../utils/catchAsync');

exports.getLeaderboard = catchAsync(async (req, res) => {
  const period = ['monthly', 'yearly'].includes(req.query.period) ? req.query.period : 'all_time';
  const result = await leaderboardService.getLeaderboard(period);
  res.json(result);
});
