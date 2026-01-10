import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid request payload',
      details: err.flatten(),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: 'AppError',
      message: err.message,
      details: err.details,
    });
  }

  console.error(err);
  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong',
  });
};
