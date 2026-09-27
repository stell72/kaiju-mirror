require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const app = express();
app.use(cors({
  origin: 'https://glistening-communication-production-e375.up.railway.app',
  credentials: true
}));
app.use(express.json());

const authRouter = require('./Routes/auth');
const quartersRoutes = require('./Routes/quarters');
const resourceTypesRoutes = require('./Routes/resource_types');
const disasterLevelRoutes = require('./Routes/disaster_level');
const reservationRoutes = require('./Routes/reservation');
const retentionRoutes = require('./Routes/retention');
const transferRoutes = require('./Routes/transfers');
const requisitionRoutes = require('./Routes/requisition')

app.use('/quarters', quartersRoutes);
app.use('/resource-types', resourceTypesRoutes);
app.use('/disaster-level', disasterLevelRoutes);
app.use('/auth', authRouter);
app.use('/retention', retentionRoutes);
app.use('/reservation', reservationRoutes);
app.use('/transfers', transferRoutes);
app.use('/requisition', requisitionRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL },
});

app.set('io', io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.userId}`);
  if (socket.user.quarterId) socket.join(`quarter:${socket.user.quarterId}`);
  socket.join('broadcast');
});

const port = process.env.PORT || 8000;
httpServer.listen(port, () => console.log(`Server running on port ${port}`));

