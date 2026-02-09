import { Response } from 'express';
import { ApiResponse, ResponseMeta } from '../types';

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ResponseMeta
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, string[]>
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): void => {
  const totalPages = Math.ceil(total / limit);
  
  successResponse(res, data, 200, {
    page,
    limit,
    total,
    totalPages,
  });
  
  res.setHeader('X-Total-Count', total.toString());
};