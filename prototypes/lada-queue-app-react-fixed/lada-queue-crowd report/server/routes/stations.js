const express = require('express');
const { getStations } = require('../store');

const router = express.Router();

// GET /stations
router.get('/', (req, res) => {
  res.json(getStations());
});

module.exports = router;
