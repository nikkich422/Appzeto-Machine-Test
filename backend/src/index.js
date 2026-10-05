import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { initSocket } from './socket.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
}));
app.use(express.json());

// API health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: "API Running Successfully",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Initializing database with demo accounts and data...');
      await seedDatabase();
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
