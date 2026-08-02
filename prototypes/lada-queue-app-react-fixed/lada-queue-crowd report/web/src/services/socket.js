import { io } from 'socket.io-client';
import { BASE_URL } from './api';

// Same real-time approach as the backend: a persistent connection so the
// server can PUSH pool-count and group-ready events the instant they
// happen on anyone's phone — not a "check every few seconds" poll.
export function createLadaSocket() {
  const socket = io(BASE_URL, { transports: ['websocket'], autoConnect: false });
  socket.connect();
  return socket;
}

export function joinLadaPool(socket, { userId, stationId, destinationId }) {
  socket.emit('lada:join', { userId, stationId, destinationId });
}
