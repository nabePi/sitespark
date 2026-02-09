import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const field = err.path[0]?.toString() || 'unknown';
          if (!details[field]) {
            details[field] = [];
          }
          details[field].push(err.message);
        });

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};