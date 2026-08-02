const { joinLadaPool, getLadaGroupMembersWithContact } = require('../store');

function poolRoom(stationId, destinationId) {
  return `pool_${stationId}_${destinationId}`;
}

function groupRoom(groupId) {
  return `group_${groupId}`;
}

// Wires up real-time Lada matching. Every phone that calls "lada:join" for
// the same station+destination joins the same Socket.IO "room" and gets
// pushed the live headcount instantly — no polling. The moment the 4th
// person joins, everyone currently in that group is moved into a private
// group room and sent each other's name + phone number.
function registerLadaSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('lada:join', ({ userId, stationId, destinationId }) => {
      if (!userId || !stationId || !destinationId) return;

      const { group, justCompleted } = joinLadaPool({ userId, stationId, destinationId });

      socket.data.userId = userId;
      socket.data.groupId = group.id;
      socket.join(poolRoom(stationId, destinationId));

      // Push the live count to every phone currently waiting on this route.
      io.to(poolRoom(stationId, destinationId)).emit('lada:pool_update', {
        groupId: group.id,
        count: group.memberIds.length,
        maxSize: group.maxSize,
        status: group.status,
      });

      if (justCompleted) {
        // Pull every connected socket that belongs to this now-full group
        // into a private room, then reveal contact info only to them.
        for (const [, s] of io.sockets.sockets) {
          if (s.data.groupId === group.id) {
            s.join(groupRoom(group.id));
          }
        }

        io.to(groupRoom(group.id)).emit('lada:ready', {
          groupId: group.id,
          members: getLadaGroupMembersWithContact(group),
        });
      }
    });

    socket.on('disconnect', () => {
      // Prototype scope: we don't remove people from a pool on disconnect,
      // so a brief network drop doesn't bump someone out of their group.
    });
  });
}

module.exports = { registerLadaSocketHandlers };
