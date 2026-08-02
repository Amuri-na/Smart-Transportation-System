const express = require('express');
const {
  joinQueue,
  getQueueEntry,
  getQueuePosition,
  cancelQueueEntry,
  confirmQueueEntry,
  getStation,
  getPhysicalLineInfo,
} = require('../store');

const router = express.Router();

// POST /queue/join  { userId, stationId, destinationId }
router.post('/join', (req, res) => {
  const { userId, stationId, destinationId } = req.body;
  if (!userId || !stationId || !destinationId) {
    return res.status(400).json({ error: 'userId, stationId, destinationId are required' });
  }
  const entry = joinQueue({ userId, stationId, destinationId });
  res.json(entry);
});

// GET /queue/:entryId/status
router.get('/:entryId/status', (req, res) => {
  const entry = getQueueEntry(req.params.entryId);
  if (!entry) return res.status(404).json({ error: 'Queue entry not found' });

  const station = getStation(entry.stationId);
  const nextTaxiEtaMinutes = station.taxiQueue[0]
    ? station.taxiQueue[0].etaMinutes
    : null;

  res.json({
    ...entry,
    position: entry.status === 'waiting' ? getQueuePosition(entry) : null,
    nextTaxiEtaMinutes,
    turnDeadline: entry.turnDeadline,
    ...getPhysicalLineInfo(entry.stationId),
  });
});

// POST /queue/:entryId/confirm  (user checks in once called)
router.post('/:entryId/confirm', (req, res) => {
  const entry = confirmQueueEntry(req.params.entryId);
  if (!entry) return res.status(404).json({ error: 'Queue entry not found' });
  res.json(entry);
});

// DELETE /queue/:entryId
router.delete('/:entryId', (req, res) => {
  const entry = cancelQueueEntry(req.params.entryId);
  if (!entry) return res.status(404).json({ error: 'Queue entry not found' });
  res.json(entry);
});

module.exports = router;
