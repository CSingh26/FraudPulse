import { Worker } from 'bullmq';
import { env } from '../config/env';
import { redisConnection } from './connection';
import { TransactionJob } from './types';

export const startWorker = () => {
  const worker = new Worker<TransactionJob>(
    env.QUEUE_NAME,
    async (job) => {
      return {
        transactionId: job.data.transactionId,
        status: 'queued',
      };
    },
    { connection: redisConnection },
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job?.id ?? 'unknown'} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id ?? 'unknown'} failed`, error);
  });

  return worker;
};
