import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { registerSocketHandlers } from './socket/handlers.js';

// Load env vars
dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Nam Thar Thau Server is running' });
});

// Register Socket handlers
registerSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  // Connect to DB
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`=================================`);
  });
};

startServer().catch(console.error);
