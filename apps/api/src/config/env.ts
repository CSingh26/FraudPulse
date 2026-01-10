import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ML_URL: z.string().min(1),
  QUEUE_NAME: z.string().default('txn-score'),
});

export const env = EnvSchema.parse(process.env);
