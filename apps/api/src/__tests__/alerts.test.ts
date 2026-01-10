import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../db';
import { createApp } from '../app';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
const describeIf = runIntegration ? describe : describe.skip;

const app = createApp();

describeIf('GET /alerts', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.investigationNote.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.merchant.deleteMany();

    const merchant = await prisma.merchant.create({
      data: {
        name: 'Alert Merchant',
        category: 'Travel',
        country: 'US',
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        amount: 620,
        currency: 'USD',
        cardId: 'CARD-9999',
        cardCountry: 'US',
        merchantId: merchant.id,
        channel: 'ECOM',
        entryMode: 'MANUAL',
        ipCountry: 'FR',
        deviceId: 'dev-9',
        occurredAt: new Date(),
      },
    });

    await prisma.alert.create({
      data: {
        transactionId: transaction.id,
        score: 0.92,
        label: 'FRAUD',
        status: 'OPEN',
        recommendedAction: 'REVIEW_AND_BLOCK',
      },
    });
  });

  afterAll(async () => {
    await prisma.investigationNote.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.merchant.deleteMany();
    await prisma.$disconnect();
  });

  it('returns alerts with pagination payload', async () => {
    const response = await request(app).get('/alerts').expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it('updates alert status and stores notes', async () => {
    const alert = await prisma.alert.findFirst();
    expect(alert).not.toBeNull();

    const response = await request(app)
      .patch(`/alerts/${alert?.id}`)
      .send({ status: 'RESOLVED', note: 'Reviewed during test', author: 'QA' })
      .expect(200);

    expect(response.body.status).toBe('RESOLVED');
    expect(response.body.notes.length).toBeGreaterThan(0);
  });
});
