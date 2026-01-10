import { Worker } from 'bullmq';

import { prisma } from '../db';
import { scoreWithMl } from '../services/ml-client';
import { env } from '../config/env';
import { redisConnection } from './connection';
import { TransactionJob } from './types';

export const startWorker = () => {
  const worker = new Worker<TransactionJob>(
    env.QUEUE_NAME,
    async (job) => {
      const transaction = await prisma.transaction.findUnique({
        where: { id: job.data.transactionId },
        include: { merchant: true },
      });

      if (!transaction) {
        return { status: 'missing' };
      }

      const mlResponse = await scoreWithMl({
        amount: transaction.amount,
        currency: transaction.currency,
        card_country: transaction.cardCountry,
        merchant_country: transaction.merchant.country,
        merchant_category: transaction.merchant.category,
        channel: transaction.channel,
        entry_mode: transaction.entryMode,
        ip_country: transaction.ipCountry,
      });

      if (mlResponse.label === 'FRAUD') {
        await prisma.alert.upsert({
          where: { transactionId: transaction.id },
          update: {
            score: mlResponse.score,
            label: mlResponse.label,
            status: 'OPEN',
            explanation: {
              topFeatures: mlResponse.top_features,
              modelVersion: mlResponse.model_version,
            },
            recommendedAction: mlResponse.recommended_action,
          },
          create: {
            transactionId: transaction.id,
            score: mlResponse.score,
            label: mlResponse.label,
            status: 'OPEN',
            explanation: {
              topFeatures: mlResponse.top_features,
              modelVersion: mlResponse.model_version,
            },
            recommendedAction: mlResponse.recommended_action,
          },
        });
      }

      return {
        status: mlResponse.label,
        score: mlResponse.score,
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
