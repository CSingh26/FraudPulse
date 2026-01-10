import { Queue } from 'bullmq';
import { env } from '../config/env';
import { redisConnection } from './connection';
import { TransactionJob } from './types';

export const txnQueue = new Queue<TransactionJob>(env.QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
