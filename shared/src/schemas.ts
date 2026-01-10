import { z } from 'zod';

export const AlertStatusSchema = z.enum([
  'OPEN',
  'INVESTIGATING',
  'ESCALATED',
  'RESOLVED',
  'FALSE_POSITIVE',
]);

export const TransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3),
  cardId: z.string().min(4),
  cardCountry: z.string().min(2),
  merchant: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    country: z.string().min(2),
  }),
  channel: z.string().min(1),
  entryMode: z.string().min(1),
  ipCountry: z.string().min(2).optional().nullable(),
  deviceId: z.string().min(1).optional().nullable(),
  occurredAt: z.string().datetime().optional(),
});

export const AlertUpdateSchema = z.object({
  status: AlertStatusSchema.optional(),
  note: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
});

export type AlertStatus = z.infer<typeof AlertStatusSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
export type AlertUpdateInput = z.infer<typeof AlertUpdateSchema>;
