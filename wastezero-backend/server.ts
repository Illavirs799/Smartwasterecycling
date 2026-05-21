import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import * as dotenv from 'dotenv';

import authRoutes from './src/routes/authRoutes';
import wasteRequestRoutes from './src/routes/wasteRequestRoutes';
import opportunityRoutes from './src/routes/opportunityRoutes';
import applicationRoutes from './src/routes/applicationRoutes';
import messageRoutes from './src/routes/messageRoutes';
import notificationRoutes from './src/routes/notificationRoutes';
import adminRoutes from './src/routes/adminRoutes';

import { createServer } from 'http';
import { initSocket } from './src/services/socketService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env['PORT'] || 5000;

// Initialize Socket.io
initSocket(httpServer);

// Middleware
app.use(cors());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api', authRoutes);
app.use('/api/waste-requests', wasteRequestRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const status =
    mongoose.connection.readyState === 1
      ? 'Connected'
      : 'Disconnected';

  res.json({
    status,
    database: 'MongoDB Atlas',
  });
});

// MongoDB Connection
const mongoUri = process.env['MONGODB_URI'];

if (!mongoUri) {
  console.error('⚠️ MONGODB_URI not found in .env file');
  process.exit(1);
}

// Disable buffering
mongoose.set('bufferCommands', false);

console.log('⏳ Connecting to MongoDB Atlas...');

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');

    // Start server ONLY after DB connection
    httpServer.listen(port, () => {
      console.log(
        `🚀 Backend Express server listening on http://localhost:${port}`
      );
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error(err);

    if (
      err.message.includes('querySrv ESERVFAIL') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('selection timed out')
    ) {
      console.error(
        '👉 Check MongoDB Atlas IP whitelist and internet connection.'
      );
    }
  });