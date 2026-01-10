process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://fraudpulse:fraudpulse@localhost:5433/fraudpulse?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.ML_URL = process.env.ML_URL || 'http://localhost:8000';
process.env.QUEUE_NAME = process.env.QUEUE_NAME || 'txn-score';
