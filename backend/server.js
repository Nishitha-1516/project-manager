const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes   = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes   = require('./routes/tasks');
const userRoutes   = require('./routes/users');

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Authenticate socket connections with JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = String(decoded.id);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: user ${socket.userId}`);

  // Client joins a project room to receive project-specific events
  socket.on('join:project', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`   ↳ joined room project:${projectId}`);
  });

  socket.on('leave:project', (projectId) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: user ${socket.userId}`);
  });
});

// Make io accessible in route handlers via req.io
app.use((req, _res, next) => { req.io = io; next(); });

// ── Express middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/users',    userRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'OK' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT        = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectmanager';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
