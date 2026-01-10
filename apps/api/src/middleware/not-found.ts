import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
};
