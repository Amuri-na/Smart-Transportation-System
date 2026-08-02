require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const usersRouter = require('./routes/users');
const stationsRouter = require('./routes/stations');
const queueRouter = require('./routes/queue');
const ladaRouter = require('./routes/lada');
const reportsRouter = require('./routes/reports');
const { startTaxiSimulation } = require('./store');
const { registerLadaSocketHandlers } = require('./sockets/ladaSocket');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', usersRouter);
app.use('/stations', stationsRouter);
app.use('/queue', queueRouter);
app.use('/lada', ladaRouter);
app.use('/reports', reportsRouter);
// Uploaded crowd-report photos/videos, served back so they can be viewed.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Lada queue prototype server running' });
});

// Socket.IO needs to attach to the raw http server (not just Express)
// so real-time events and the REST API share the same port.
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

registerLadaSocketHandlers(io);

// Starts the fake taxi movement + auto-cancel loop (see store.js)
startTaxiSimulation();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('Real-time Lada matching is live via Socket.IO on the same port.');
});
