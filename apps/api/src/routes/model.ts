import { Router } from 'express';

import { env } from '../config/env';
import { AppError } from '../errors';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const response = await fetch(`${env.ML_URL}/model`);
    if (!response.ok) {
      const message = await response.text();
      throw new AppError('ML model info unavailable', 502, {
        status: response.status,
        body: message,
      });
    }

    res.json(await response.json());
  } catch (error) {
    next(error);
  }
});

export { router as modelRouter };
