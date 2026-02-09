import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { RateLimitError } from '../utils/errors';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, _next: NextFunction) => {
    throw new RateLimitError();
  },
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, _next: NextFunction) => {
    throw new RateLimitError('Too many requests, please try again later');
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, _next: NextFunction) => {
    throw new RateLimitError('Too many authentication attempts, please try again later');
  },
});