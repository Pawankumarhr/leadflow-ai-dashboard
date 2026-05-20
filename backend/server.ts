import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import leadRoutes from './routes/leadRoutes';
import userRoutes from './routes/userRoutes';
import auditRoutes from './routes/auditRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (before DB connection)
app.get('/health', (_req, res) => {
  res.json({ status: 'Server is running' });
});

// Placeholder routes
app.get('/api/test', (_req, res) => {
  res.json({ message: 'Backend API is working' });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

// Start server and connect to DB
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

console.log('Connecting to MongoDB...');

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err: Error) => {
    console.log('❌ MongoDB connection failed:', err.message);
  });

export default app;
