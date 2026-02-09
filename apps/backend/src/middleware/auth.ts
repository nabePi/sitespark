import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserPayload } from '../types';
import { verifyAccessToken } from '../utils/auth';
import { AuthenticationError } from '../utils/errors';
import logger from '../config/logger';

const authLogger = logger.child({ component: 'AuthMiddleware' });

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AuthenticationError('Token not provided');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    
    authLogger.debug({ userId: payload.id }, 'User authenticated');
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired'));
    } else if (error instanceof Error && error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else {
      authLogger.error({ error }, 'Authentication error');
      next(new AuthenticationError());
    }
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
};