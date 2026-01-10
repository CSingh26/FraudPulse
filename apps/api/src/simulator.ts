import dotenv from 'dotenv';

dotenv.config();

const apiUrl = process.env.SIMULATOR_API_URL || 'http://localhost:3001';
const ratePerSecond = Number(process.env.SIMULATOR_RATE_PER_SEC || '2');

const merchants = [
  { name: 'Arcadia Electronics', category: 'Electronics', country: 'US' },
  { name: 'Northwind Outfitters', category: 'Apparel', country: 'GB' },
  { name: 'Solstice Grocers', category: 'Grocery', country: 'CA' },
  { name: 'Sunset Travel Co', category: 'Travel', country: 'US' },
  { name: 'Aurora Luxury Goods', category: 'Luxury', country: 'AE' },
  { name: 'Nimbus Gaming', category: 'Gaming', country: 'DE' },
  { name: 'Harbor Utilities', category: 'Utilities', country: 'FR' },
];

const cardCountries = ['US', 'GB', 'CA', 'DE', 'FR', 'AE', 'SG', 'BR', 'IN', 'NG'];
const channels = ['POS', 'ECOM', 'ATM'];
const entryModes = ['CHIP', 'SWIPE', 'MANUAL'];

const randomPick = <T>(values: T[]) => values[Math.floor(Math.random() * values.length)];

const randomAmount = () => {
  const base = Math.random() * 500 + 20;
  return Math.random() > 0.85 ? base * 6 : base;
};

const generateTransaction = () => {
  const merchant = randomPick(merchants);
  const cardCountry = randomPick(cardCountries);
  const channel = randomPick(channels);
  const entryMode = channel === 'ECOM' ? 'MANUAL' : randomPick(entryModes);
  const ipCountry =
    channel === 'ECOM' && Math.random() > 0.65 ? randomPick(cardCountries) : cardCountry;

  return {
    amount: Number(randomAmount().toFixed(2)),
    currency: cardCountry === 'US' ? 'USD' : cardCountry === 'GB' ? 'GBP' : 'USD',
    cardId: `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
    cardCountry,
    merchant,
    channel,
    entryMode,
    ipCountry,
    deviceId: `dev-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: new Date().toISOString(),
  };
};

const sendTransaction = async () => {
  const payload = generateTransaction();
  const response = await fetch(`${apiUrl}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to enqueue transaction');
  }

  return response.json();
};

const intervalMs = Math.max(250, Math.floor(1000 / Math.max(1, ratePerSecond)));

let sent = 0;

console.log(`Simulator running at ~${ratePerSecond} tx/sec -> ${apiUrl}`);

setInterval(async () => {
  try {
    await sendTransaction();
    sent += 1;
    if (sent % 10 === 0) {
      console.log(`Sent ${sent} transactions`);
    }
  } catch (error) {
    console.error('Simulator error', error);
  }
}, intervalMs);
