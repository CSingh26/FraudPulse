import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { requestLogger } from './middleware/request-logger';
import { alertsRouter } from './routes/alerts';
import { metricsRouter } from './routes/metrics';
import { modelRouter } from './routes/model';
import { transactionsRouter } from './routes/transactions';

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

  app.use('/transactions', transactionsRouter);
  app.use('/alerts', alertsRouter);
  app.use('/metrics', metricsRouter);
  app.use('/model', modelRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
