const express = require('express');
const { joinLadaPool, getLadaGroup, getUserById } = require('../store');

const router = express.Router();

// POST /lada/join  { userId, stationId, destinationId }
// This REST route still works as a fallback, but real-time updates
// (live headcount across everyone's phones) happen over the
// Socket.IO connection — see server/sockets/ladaSocket.js.
router.post('/join', (req, res) => {
  const { userId, stationId, destinationId } = req.body;
  if (!userId || !stationId || !destinationId) {
    return res.status(400).json({ error: 'userId, stationId, destinationId are required' });
  }
  const { group } = joinLadaPool({ userId, stationId, destinationId });
  res.json(group);
});

// GET /lada/:groupId/status
router.get('/:groupId/status', (req, res) => {
  const group = getLadaGroup(req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Lada group not found' });

  const members = group.memberIds.map((id) => {
    const u = getUserById(id);
    return u ? { id: u.id, name: u.name } : { id };
  });

  res.json({ ...group, members });
});

module.exports = router;
