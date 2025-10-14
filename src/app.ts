import express, { Application } from 'express';
import helmet from 'helmet';
import { appConfig } from './config';
import {
  corsMiddleware,
  globalRateLimit,
  requestLogger,
  errorHandler,
  notFoundHandler
} from './middlewares';
import routes from './routes';

const app: Application = express();

// Security middlewares
app.use(helmet());
app.use(corsMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);

// Rate limiting
app.use(globalRateLimit);

// API routes
app.use(appConfig.apiPrefix, routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
