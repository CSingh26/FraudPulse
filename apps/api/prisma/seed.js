const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const merchants = [
  { name: 'Arcadia Electronics', category: 'Electronics', country: 'US' },
  { name: 'Northwind Outfitters', category: 'Apparel', country: 'GB' },
  { name: 'Solstice Grocers', category: 'Grocery', country: 'CA' },
  { name: 'Sunset Travel Co', category: 'Travel', country: 'US' },
  { name: 'Aurora Luxury Goods', category: 'Luxury', country: 'AE' },
];

const transactionsSeed = [
  {
    amount: 128.25,
    currency: 'USD',
    cardId: 'CARD-1001',
    cardCountry: 'US',
    merchant: { name: 'Arcadia Electronics', country: 'US' },
    channel: 'ECOM',
    entryMode: 'MANUAL',
    ipCountry: 'NG',
    deviceId: 'dev-a1',
    occurredAt: new Date(Date.now() - 1000 * 60 * 40),
  },
  {
    amount: 42.1,
    currency: 'GBP',
    cardId: 'CARD-2044',
    cardCountry: 'GB',
    merchant: { name: 'Northwind Outfitters', country: 'GB' },
    channel: 'POS',
    entryMode: 'CHIP',
    ipCountry: null,
    deviceId: 'pos-44',
    occurredAt: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    amount: 580.9,
    currency: 'USD',
    cardId: 'CARD-9988',
    cardCountry: 'US',
    merchant: { name: 'Sunset Travel Co', country: 'US' },
    channel: 'ECOM',
    entryMode: 'MANUAL',
    ipCountry: 'RU',
    deviceId: 'dev-t9',
    occurredAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    amount: 19.55,
    currency: 'CAD',
    cardId: 'CARD-3002',
    cardCountry: 'CA',
    merchant: { name: 'Solstice Grocers', country: 'CA' },
    channel: 'POS',
    entryMode: 'SWIPE',
    ipCountry: null,
    deviceId: 'pos-12',
    occurredAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    amount: 2200.0,
    currency: 'AED',
    cardId: 'CARD-7777',
    cardCountry: 'AE',
    merchant: { name: 'Aurora Luxury Goods', country: 'AE' },
    channel: 'ECOM',
    entryMode: 'MANUAL',
    ipCountry: 'FR',
    deviceId: 'dev-lx',
    occurredAt: new Date(Date.now() - 1000 * 60 * 5),
  },
];

async function main() {
  for (const merchant of merchants) {
    await prisma.merchant.upsert({
      where: {
        name_country: {
          name: merchant.name,
          country: merchant.country,
        },
      },
      update: {},
      create: merchant,
    });
  }

  const merchantRecords = await prisma.merchant.findMany();
  const merchantMap = new Map(
    merchantRecords.map((merchant) => [`${merchant.name}:${merchant.country}`, merchant]),
  );

  const createdTransactions = [];
  for (const tx of transactionsSeed) {
    const key = `${tx.merchant.name}:${tx.merchant.country}`;
    const merchant = merchantMap.get(key);
    if (!merchant) {
      throw new Error(`Missing merchant seed for ${key}`);
    }

    const created = await prisma.transaction.create({
      data: {
        amount: tx.amount,
        currency: tx.currency,
        cardId: tx.cardId,
        cardCountry: tx.cardCountry,
        merchantId: merchant.id,
        channel: tx.channel,
        entryMode: tx.entryMode,
        ipCountry: tx.ipCountry,
        deviceId: tx.deviceId,
        occurredAt: tx.occurredAt,
      },
    });

    createdTransactions.push(created);
  }

  const highRisk = createdTransactions.filter((tx) => tx.amount > 500);
  for (const tx of highRisk) {
    const alert = await prisma.alert.create({
      data: {
        transactionId: tx.id,
        score: 0.93,
        label: 'FRAUD',
        status: 'OPEN',
        explanation: {
          topFeatures: [
            { name: 'amount', impact: 0.28 },
            { name: 'ip_country_mismatch', impact: 0.22 },
            { name: 'entry_mode_manual', impact: 0.15 },
          ],
        },
        recommendedAction: 'REVIEW_AND_BLOCK',
      },
    });

    await prisma.investigationNote.create({
      data: {
        alertId: alert.id,
        author: 'System Seed',
        note: 'Flagged high-risk transaction pending analyst review.',
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
