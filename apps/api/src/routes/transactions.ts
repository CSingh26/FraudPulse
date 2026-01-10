import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db';
import { AppError } from '../errors';
import { txnQueue } from '../queue/queue';

const router = Router();

const merchantSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  country: z.string().min(2),
});

const transactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3),
  cardId: z.string().min(4),
  cardCountry: z.string().min(2),
  merchant: merchantSchema,
  channel: z.string().min(1),
  entryMode: z.string().min(1),
  ipCountry: z.string().min(2).optional().nullable(),
  deviceId: z.string().min(1).optional().nullable(),
  occurredAt: z.string().datetime().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const payload = transactionSchema.parse(req.body);
    const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();

    const merchant = await prisma.merchant.upsert({
      where: {
        name_country: {
          name: payload.merchant.name,
          country: payload.merchant.country,
        },
      },
      update: {
        category: payload.merchant.category,
      },
      create: {
        name: payload.merchant.name,
        category: payload.merchant.category,
        country: payload.merchant.country,
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        amount: payload.amount,
        currency: payload.currency,
        cardId: payload.cardId,
        cardCountry: payload.cardCountry,
        merchantId: merchant.id,
        channel: payload.channel,
        entryMode: payload.entryMode,
        ipCountry: payload.ipCountry,
        deviceId: payload.deviceId,
        occurredAt,
      },
    });

    const job = await txnQueue.add(
      'score-transaction',
      { transactionId: transaction.id },
      { removeOnComplete: true, removeOnFail: false },
    );

    res.status(202).json({
      transactionId: transaction.id,
      jobId: job.id,
      queued: true,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where = query.q
      ? {
          OR: [
            {
              cardId: {
                contains: query.q,
                mode: 'insensitive',
              },
            },
            {
              merchant: {
                name: {
                  contains: query.q,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }
      : {};

    const [total, transactions] = await prisma.$transaction([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          merchant: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        skip,
        take: query.pageSize,
      }),
    ]);

    res.json({
      data: transactions,
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { merchant: true, alert: true },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

export { router as transactionsRouter };
