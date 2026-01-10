import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '../db';
import { AppError } from '../errors';

const router = Router();

const statusEnum = z.enum(['OPEN', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'FALSE_POSITIVE']);

const listQuerySchema = z.object({
  status: statusEnum.optional(),
  minScore: z.coerce.number().min(0).max(1).optional(),
  merchant: z.string().min(1).optional(),
  cardCountry: z.string().min(2).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where: Prisma.AlertWhereInput = {};
    const transactionFilter: Prisma.TransactionWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.minScore !== undefined) {
      where.score = { gte: query.minScore };
    }

    if (query.merchant) {
      transactionFilter.merchant = {
        name: {
          contains: query.merchant,
          mode: 'insensitive',
        },
      };
    }

    if (query.cardCountry) {
      transactionFilter.cardCountry = query.cardCountry;
    }

    if (query.startDate || query.endDate) {
      transactionFilter.occurredAt = {
        gte: query.startDate ? new Date(query.startDate) : undefined,
        lte: query.endDate ? new Date(query.endDate) : undefined,
      };
    }

    if (Object.keys(transactionFilter).length > 0) {
      where.transaction = transactionFilter;
    }

    const [total, alerts] = await prisma.$transaction([
      prisma.alert.count({ where }),
      prisma.alert.findMany({
        where,
        include: {
          transaction: {
            include: {
              merchant: true,
            },
          },
          notes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: query.pageSize,
      }),
    ]);

    res.json({
      data: alerts,
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
    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
      include: {
        transaction: {
          include: {
            merchant: true,
          },
        },
        notes: true,
      },
    });

    if (!alert) {
      throw new AppError('Alert not found', 404);
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

const updateSchema = z
  .object({
    status: statusEnum.optional(),
    note: z.string().min(1).optional(),
    author: z.string().min(1).default('Analyst'),
  })
  .refine((data) => data.status || data.note, {
    message: 'Provide a status or note update',
  });

router.patch('/:id', async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const payload = updateSchema.parse(req.body);

    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: payload.status ? { status: payload.status } : {},
    });

    if (payload.note) {
      await prisma.investigationNote.create({
        data: {
          alertId: alert.id,
          author: payload.author,
          note: payload.note,
        },
      });
    }

    const updated = await prisma.alert.findUnique({
      where: { id: alert.id },
      include: {
        transaction: {
          include: {
            merchant: true,
          },
        },
        notes: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export { router as alertsRouter };
