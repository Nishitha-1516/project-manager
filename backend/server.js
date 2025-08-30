import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

dotenv.config();
connectDB();
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"]
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('joinProject', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project room ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));