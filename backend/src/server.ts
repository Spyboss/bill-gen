// Set up minimal crypto polyfill directly
if (typeof globalThis.crypto === 'undefined') {
  console.log('Setting up minimal crypto polyfill');
  globalThis.crypto = {
    subtle: {
      // Simple HMAC implementation
      async importKey(format, keyData, algorithm, extractable, keyUsages) {
        return { type: algorithm.name, key: keyData };
      },

      async sign(algorithm, key, data) {
        console.log('Using minimal crypto.subtle.sign implementation');
        // This is a very basic implementation and should be replaced with a proper one
        return new Uint8Array(32); // Return a dummy signature
      },

      async verify(algorithm, key, signature, data) {
        console.log('Using minimal crypto.subtle.verify implementation');
        return true; // Always verify in this minimal implementation
      }
    },
    getRandomValues: (array) => {
      console.log('Using minimal crypto.getRandomValues implementation');
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomBytes: (size) => {
      console.log('Using minimal crypto.randomBytes implementation');
      const array = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return {
        toString: (encoding) => {
          if (encoding === 'hex') {
            return Array.from(array)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
          }
          return array.toString();
        }
      };
    },
    createHash: (algorithm) => {
      console.log(`Using minimal crypto.createHash implementation with algorithm: ${algorithm}`);
      let data = '';

      return {
        update: function(text) {
          data += text;
          return this;
        },
        digest: (encoding) => {
          console.log(`Digesting with encoding: ${encoding}`);
          // Simple hash function for fallback
          let hash = 0;
          for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
          }

          // Convert to hex string
          const hashHex = (hash >>> 0).toString(16).padStart(8, '0');
          // Pad to look like SHA-256
          return hashHex.repeat(8).substring(0, 64);
        }
      };
    }
  };
}

// Try to import the crypto polyfill for additional functionality
import('./utils/jose-crypto.js').catch(error => {
  console.log('Could not import jose-crypto.js, using minimal polyfill:', error.message);
});

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from './models/User.js';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

// Force set critical environment variables if they're missing
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
  process.env.ENCRYPTION_KEY = 'a5f3d8c1b4e2a9f7d6c3b5a2e4f8c9d6';
  console.log('Set ENCRYPTION_KEY directly in code');
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import { connectToMongoose, closeDatabaseConnection } from './config/database.js';
import { getRedisClient, closeRedisConnection } from './config/redis.js';
import logger from './utils/logger.js';
import billRoutes from './routes/billRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import bikeModelsRoutes from './routes/bike-models.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import authRoutes from './auth/auth.routes.js';
import gdprRoutes from './routes/gdprRoutes.js';
import { apiRateLimit } from './auth/rate-limit.middleware.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { applySecurityMiddleware } from './middleware/security-middleware.js';
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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  },
  xssFilter: true,
  hsts: {
    maxAge: 63072000, // 2 years in seconds
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
})); // Security headers

// Apply security middleware
applySecurityMiddleware(app);

// Standard CORS middleware configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) for specific scenarios if needed,
    // or enforce origin check strictly. For now, let's be strict.
    if (!origin && process.env.NODE_ENV !== 'development') { // Allow no origin in dev for tools like Postman
        // In production, you might want to block requests with no origin or handle them differently.
        // For now, if there's no origin and it's not dev, let's assume it's not allowed for safety.
        // return callback(new Error('Not allowed by CORS (no origin)'), false);
        // Allowing no-origin for now, but this can be tightened.
         return callback(null, true);
    }
    if (origin && allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      logger.warn(msg); // Log denied origins
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Important for cookies, authorization headers with HTTPS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Explicitly list allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Explicitly list allowed headers
}));

// Security middlewares
// Note: The cors() middleware handles OPTIONS preflight requests automatically.
app.use(mongoSanitize()); // Sanitize inputs against NoSQL Injection
app.use(express.json({ limit: '100kb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '100kb' })); // Parse URL-encoded bodies with size limit
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
      '/api/inventory',
      '/api/gdpr'
    ]
  });
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/bike-models', bikeModelsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/gdpr', gdprRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export the app for testing
export default app;

// Check if we're running in admin creation mode
const args = process.argv.slice(2);
if (args.includes('--create-admin')) {
  // Don't start the server normally, just create the admin
  (async () => {
    try {
      // Extract admin details from command line args
      const emailArg = args.find(arg => arg.startsWith('--email='));
      const passwordArg = args.find(arg => arg.startsWith('--password='));
      const nameArg = args.find(arg => arg.startsWith('--name='));

      if (!emailArg || !passwordArg) {
        console.error('Error: Admin creation requires --email=email@example.com and --password=yourpassword');
        process.exit(1);
      }

      const email = emailArg.split('=')[1];
      const password = passwordArg.split('=')[1];
      const name = nameArg ? nameArg.split('=')[1] : 'System Administrator';

      // Connect to database explicitly
      logger.info('Connecting to MongoDB for admin creation...');
      await connectToMongoose();
      logger.info('Connected to MongoDB');

      // Check if admin user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        logger.info(`Admin user with email ${email} already exists`);
        await closeDatabaseConnection();
        process.exit(0);
      }

      // Create admin user
      const user = await User.create({
        email,
        password,
        name,
        role: 'admin'
      });

      logger.info(`Admin user created successfully: ${email} (ID: ${user._id})`);

      // Close database connection
      await closeDatabaseConnection();
      process.exit(0);
    } catch (error) {
      logger.error(`Error creating admin user: ${error}`);
      process.exit(1);
    }
  })();
} else {
  // Start server normally
  const server = app.listen(port, async () => {
    try {
      // Connect to database
      await connectToMongoose();

      // Initialize Redis
      getRedisClient();

      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
    } catch (error) {
      logger.error(`Server startup error: ${error}`);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(async () => {
      logger.info('HTTP server closed');
      await closeDatabaseConnection();
      await closeRedisConnection();
      process.exit(0);
    });
  });
}
