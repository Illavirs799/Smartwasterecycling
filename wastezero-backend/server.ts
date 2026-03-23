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
const port = process.env['PORT'] || 4000;

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


// Database connection
const mongoUri = process.env['MONGODB_URI'];
if (!mongoUri) {
  console.error('⚠️ WARNING: MONGODB_URI is not defined in .env file');
} else {
  // Mask URI for logging
  const maskedUri = mongoUri.replace(/\/\/.*@/, '//****:****@');
  console.log(`⏳ Connecting to MongoDB at ${maskedUri}...`);
  
  // Disable command buffering so queries fail fast if connection is down
  mongoose.set('bufferCommands', false);

  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000, // Timeout after 10s for more stability
  })
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      console.error('🔍 Error Details:', err); // Log full error object for diagnostics
      if (err.message.includes('querySrv ESERVFAIL') || err.message.includes('ECONNREFUSED') || err.message.includes('selection timed out')) {
        console.error('👉 TIP: This error often happens on restrictive networks or if your IP is not whitelisted in MongoDB Atlas.');
      }
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const status = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ status, database: 'MongoDB Atlas' });
});

httpServer.listen(port, () => {
    console.log(`Backend Express server listening on http://localhost:${port}`);
});
