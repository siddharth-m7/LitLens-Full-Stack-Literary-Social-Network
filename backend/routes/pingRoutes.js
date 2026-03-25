const express = require('express');
const router = express.Router();

// when api/ping is called it does nothing only console logs date and time
router.get('/', (req, res) => {
  const currentTime = new Date();
  console.log(`Ping received at: ${currentTime}`);
  res.status(200).json({ message: 'Ping successful', time: currentTime });
});

module.exports = router;
