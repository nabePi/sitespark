import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { tokenManagerService } from '../services/token/tokenManager.service';
import { successResponse, paginatedResponse } from '../utils/response';
import logger from '../config/logger';

const tokenLogger = logger.child({ component: 'TokenController' });

export const getBalance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    const balance = await tokenManagerService.getBalance(userId!);
    
    successResponse(res, {
      balance,
      costs: {
        websiteGeneration: tokenManagerService.getWebsiteGenerationCost(),
        contentGeneration: tokenManagerService.getContentGenerationCost(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { transactions, total } = await tokenManagerService.getTransactionHistory(
      userId!,
      page,
      limit
    );

    paginatedResponse(res, transactions, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Admin only - add tokens manually
export const addTokens = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, amount, description } = req.body;

    // Note: In production, add admin role check here

    const result = await tokenManagerService.addTokens({
      userId,
      amount,
      type: 'purchase',
      description: description || 'Manual token addition',
    });

    tokenLogger.info({ userId, amount, adminId: req.user?.id }, 'Tokens added manually');

    successResponse(res, {
      message: 'Tokens added successfully',
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    });
  } catch (error) {
    next(error);
  }
};