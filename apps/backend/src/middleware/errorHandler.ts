import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

const errorLogger = logger.child({ component: 'ErrorHandler' });

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.toApiError(),
    });
    return;
  }

  // Log unexpected errors
  errorLogger.error({
    error: err.message,
    stack: err.stack,
  }, 'Unexpected error');

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
};

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError('NOT_FOUND', 'Route not found', 404);
  next(error);
};