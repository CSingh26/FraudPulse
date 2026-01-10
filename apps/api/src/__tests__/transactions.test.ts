import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';

import { prisma } from '../db';
import { createApp } from '../app';

vi.mock('../queue/queue', () => ({
  txnQueue: {
    add: vi.fn().mockResolvedValue({ id: 'job-1' }),
  },
}));

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
const describeIf = runIntegration ? describe : describe.skip;

const app = createApp();

describeIf('POST /transactions', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.investigationNote.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.merchant.deleteMany();
  });

  afterAll(async () => {
    await prisma.investigationNote.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.merchant.deleteMany();
    await prisma.$disconnect();
  });

  it('creates a transaction and enqueues a job', async () => {
    const payload = {
      amount: 140.5,
      currency: 'USD',
      cardId: 'CARD-1001',
      cardCountry: 'US',
      merchant: {
        name: 'Test Merchant',
        category: 'Electronics',
        country: 'US',
      },
      channel: 'ECOM',
      entryMode: 'MANUAL',
      ipCountry: 'NG',
      deviceId: 'dev-test',
    };

    const response = await request(app).post('/transactions').send(payload).expect(202);

    expect(response.body.transactionId).toBeDefined();
    expect(response.body.queued).toBe(true);

    const transaction = await prisma.transaction.findUnique({
      where: { id: response.body.transactionId },
    });

    expect(transaction).not.toBeNull();
  });
});
