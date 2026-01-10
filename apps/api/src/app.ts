import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { requestLogger } from './middleware/request-logger';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
