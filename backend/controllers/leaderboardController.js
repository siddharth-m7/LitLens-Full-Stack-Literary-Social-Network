const leaderboardService = require('../services/leaderboardService');

exports.getLeaderboard = async (req, res) => {
  try {
    const result = await leaderboardService.getLeaderboard();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
