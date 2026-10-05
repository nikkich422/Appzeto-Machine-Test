import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-appzeto-2026';

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1] ||
      socket.handshake.query?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.data.user = decoded;
      } catch (err) {
        console.warn('Socket connection without valid token, continuing as guest');
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    if (user?.id) {
      socket.join(`user:${user.id}`);
      console.log(`User connected to socket: ${user.name} (${user.id})`);
    }

    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project room: ${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`Socket ${socket.id} left project room: ${projectId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
};

export const broadcastProjectEvent = (projectId, event, payload) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, payload);
  }
};

export const sendRealtimeNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', notification);
  }
};
