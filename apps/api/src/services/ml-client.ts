import { env } from '../config/env';
import { AppError } from '../errors';

export type MlScoreResponse = {
  score: number;
  label: 'FRAUD' | 'LEGIT';
  recommended_action: string;
  model_version: string;
  top_features: Array<{ name: string; impact: number }>;
};

export type MlScoreRequest = {
  amount: number;
  currency: string;
  card_country: string;
  merchant_country: string;
  merchant_category: string;
  channel: string;
  entry_mode: string;
  ip_country?: string | null;
};

export const scoreWithMl = async (payload: MlScoreRequest): Promise<MlScoreResponse> => {
  const response = await fetch(`${env.ML_URL}/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new AppError('ML service error', 502, {
      status: response.status,
      body: message,
    });
  }

  return (await response.json()) as MlScoreResponse;
};
