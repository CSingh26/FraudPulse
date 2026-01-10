import { Router } from 'express';

import { prisma } from '../db';

const router = Router();

router.get('/overview', async (_req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const transactionCounts = await prisma.$queryRaw<Array<{ day: Date; total: number }>>`
      SELECT date_trunc('day', "occurredAt") AS day, COUNT(*)::int AS total
      FROM "Transaction"
      WHERE "occurredAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;

    const fraudCounts = await prisma.$queryRaw<Array<{ day: Date; fraud: number }>>`
      SELECT date_trunc('day', t."occurredAt") AS day, COUNT(*)::int AS fraud
      FROM "Alert" a
      JOIN "Transaction" t ON a."transactionId" = t."id"
      WHERE t."occurredAt" >= ${since} AND a."label" = 'FRAUD'
      GROUP BY day
      ORDER BY day ASC
    `;

    const fraudMap = new Map(fraudCounts.map((row) => [row.day.toISOString(), row.fraud]));

    const fraudRateSeries = transactionCounts.map((row) => {
      const fraud = fraudMap.get(row.day.toISOString()) ?? 0;
      return {
        date: row.day.toISOString(),
        total: row.total,
        fraud,
        fraudRate: row.total ? fraud / row.total : 0,
      };
    });

    const statusCounts = await prisma.alert.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const avgScore = await prisma.alert.aggregate({
      _avg: { score: true },
    });

    const topMerchants = await prisma.$queryRaw<
      Array<{ merchantId: string; merchantName: string; alertCount: number; avgScore: number }>
    >`
      SELECT m."id" AS "merchantId",
             m."name" AS "merchantName",
             COUNT(a."id")::int AS "alertCount",
             AVG(a."score")::float AS "avgScore"
      FROM "Alert" a
      JOIN "Transaction" t ON a."transactionId" = t."id"
      JOIN "Merchant" m ON t."merchantId" = m."id"
      GROUP BY m."id", m."name"
      ORDER BY AVG(a."score") DESC
      LIMIT 5
    `;

    res.json({
      fraudRateSeries,
      statusCounts: statusCounts.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      avgScore: avgScore._avg.score ?? 0,
      topMerchants,
    });
  } catch (error) {
    next(error);
  }
});

export { router as metricsRouter };
