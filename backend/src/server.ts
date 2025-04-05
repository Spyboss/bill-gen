// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import { connectToMongoose, closeDatabaseConnection } from './config/database.js';
import logger from './utils/logger.js';
import billRoutes from './routes/billRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import bikeModelsRoutes from './routes/bike-models.js';
import authRoutes from './auth/auth.routes.js';
import gdprRoutes from './routes/gdprRoutes.js';
import { apiRateLimit } from './auth/rate-limit.middleware.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import User from './models/User.js';
import Bill from './models/Bill.js';

// Initialize express
const app = express();
const port = process.env.PORT || 8080;

// CORS Configuration
const allowedOrigins = [
  'https://bill-gen-production.up.railway.app',
  'https://gunawardanamotors.pages.dev',
  'http://localhost:5173' // For local development
];

// Log CORS settings for debugging
logger.info(`CORS Origins set to: ${allowedOrigins.join(', ')}`);

// Apply middlewares
app.use(helmet()); // Security headers

// Custom CORS middleware to handle multiple origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Security middlewares
app.use(mongoSanitize()); // Sanitize inputs against NoSQL Injection
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies for JWT refresh tokens
app.use(morgan('dev', {
  skip: () => process.env.NODE_ENV === 'test',
  stream: { write: (message: string) => logger.http(message.trim()) }
}));

// Apply global rate limiting to all routes
app.use(apiRateLimit);

// Make models available to middleware
app.use((req, res, next) => {
  req.app.locals.models = {
    User,
    Bill
  };
  next();
});

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bill Generator API is running',
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/bills',
      '/api/bike-models',
      '/api/gdpr'
    ]
  });
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/bike-models', bikeModelsRoutes);
app.use('/api/gdpr', gdprRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(port, async () => {
  try {
    // Connect to database
    await connectToMongoose();
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
  } catch (error) {
    logger.error(`Failed to start server: ${(error as Error).message}`);
    // Give time for logs to be written before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  server.close(async () => {
    logger.info('HTTP server closed');
    await closeDatabaseConnection();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received');
  server.close(async () => {
    logger.info('HTTP server closed');
    await closeDatabaseConnection();
    process.exit(0);
  });
});

export default app; 