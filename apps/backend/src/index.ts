import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { corsConfig } from './config/cors';
import logger, { createChildLogger } from './config/logger';
import { apiRateLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import websiteRoutes from './routes/website.routes';
import blogRoutes from './routes/blog.routes';
import formRoutes from './routes/form.routes';
import tokenRoutes from './routes/token.routes';
import aiRoutes from './routes/ai.routes';

// Socket handlers
import { setupSocketHandlers } from './socket';

const appLogger = createChildLogger('Server');

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: corsConfig,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Security middleware
app.use(helmet());
app.use(cors(corsConfig));

// Rate limiting
app.use(apiRateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.debug({
    method: req.method,
    path: req.path,
    ip: req.ip,
  }, 'Incoming request');
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/websites/:websiteId/blogs', blogRoutes);
app.use('/api/forms/:websiteId', formRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = env.PORT;

httpServer.listen(PORT, () => {
  appLogger.info(`🚀 Server running on port ${PORT}`);
  appLogger.info(`📊 Environment: ${env.NODE_ENV}`);
  appLogger.info(`🔗 API URL: ${env.API_URL}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  appLogger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  httpServer.close(() => {
    appLogger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    appLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  appLogger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  appLogger.error({ reason }, 'Unhandled rejection');
  process.exit(1);
});

export { app, io };