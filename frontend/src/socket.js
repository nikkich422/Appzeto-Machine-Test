import { io } from 'socket.io-client';

let socket = null;

export const getSocket = (token) => {
  if (!socket) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const serverUrl = isLocal ? `http://${window.location.hostname}:5001` : window.location.origin;

    socket = io(serverUrl, {
      auth: {
        token: token || localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connect error:', error.message);
    });
  }
  return socket;
};

export const resetSocket = (token) => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket(token);
};
