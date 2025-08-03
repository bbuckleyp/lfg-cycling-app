// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import stravaRoutes from './routes/strava';
import routesRoutes from './routes/routes';
import ridesRoutes from './routes/rides';
import rsvpRoutes from './routes/rsvps';
import commentRoutes from './routes/comments';
import { notificationRoutes } from './routes/notifications';

console.log('🔧 Environment variables loaded');
console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('🚴 STRAVA_CLIENT_ID:', process.env.STRAVA_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('🚴 STRAVA_CLIENT_SECRET:', process.env.STRAVA_CLIENT_SECRET ? 'SET' : 'NOT SET');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:5174',
    FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/strava', stravaRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api', rsvpRoutes);
app.use('/api', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
}).on('error', (err) => {
  console.error('Server error:', err);
});