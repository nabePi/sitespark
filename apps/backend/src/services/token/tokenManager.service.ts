import { prisma } from '../../config/database';
import logger from '../../config/logger';
import { env } from '../../config/env';
import { TokenTransactionType, User } from '../../types';
import { InsufficientTokensError, NotFoundError } from '../../utils/errors';

const tokenLogger = logger.child({ component: 'TokenManagerService' });

interface TokenOperation {
  userId: string;
  amount: number;
  type: TokenTransactionType;
  description: string;
  metadata?: Record<string, unknown>;
}

export class TokenManagerService {
  private readonly SIGNUP_BONUS = env.TOKENS_SIGNUP_BONUS;
  private readonly DAILY_LOGIN = env.TOKENS_DAILY_LOGIN;
  private readonly WEBSITE_GENERATION = env.TOKENS_WEBSITE_GENERATION;
  private readonly CONTENT_GENERATION = env.TOKENS_CONTENT_GENERATION;

  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokensBalance: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user.tokensBalance;
  }

  async addTokens(operation: TokenOperation): Promise<{ newBalance: number; transactionId: string }> {
    tokenLogger.info({ 
      userId: operation.userId, 
      amount: operation.amount, 
      type: operation.type 
    }, 'Adding tokens');

    const result = await prisma.$transaction(async (tx) => {
      // Update user balance
      const user = await tx.user.update({
        where: { id: operation.userId },
        data: {
          tokensBalance: {
            increment: operation.amount,
          },
        },
      });

      // Create transaction record
      const transaction = await tx.tokenTransaction.create({
        data: {
          userId: operation.userId,
          amount: operation.amount,
          type: operation.type,
          description: operation.description,
          metadata: operation.metadata || {},
        },
      });

      return { user, transaction };
    });

    tokenLogger.info({ 
      userId: operation.userId, 
      newBalance: result.user.tokensBalance,
      transactionId: result.transaction.id
    }, 'Tokens added successfully');

    return {
      newBalance: result.user.tokensBalance,
      transactionId: result.transaction.id,
    };
  }

  async deductTokens(operation: TokenOperation): Promise<{ newBalance: number; transactionId: string }> {
    tokenLogger.info({ 
      userId: operation.userId, 
      amount: operation.amount, 
      type: operation.type 
    }, 'Deducting tokens');

    const result = await prisma.$transaction(async (tx) => {
      // Check current balance
      const user = await tx.user.findUnique({
        where: { id: operation.userId },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.tokensBalance < operation.amount) {
        throw new InsufficientTokensError(operation.amount, user.tokensBalance);
      }

      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: operation.userId },
        data: {
          tokensBalance: {
            decrement: operation.amount,
          },
        },
      });

      // Create transaction record (negative amount for deduction)
      const transaction = await tx.tokenTransaction.create({
        data: {
          userId: operation.userId,
          amount: -operation.amount,
          type: operation.type,
          description: operation.description,
          metadata: operation.metadata || {},
        },
      });

      return { user: updatedUser, transaction };
    });

    tokenLogger.info({ 
      userId: operation.userId, 
      newBalance: result.user.tokensBalance,
      transactionId: result.transaction.id
    }, 'Tokens deducted successfully');

    return {
      newBalance: result.user.tokensBalance,
      transactionId: result.transaction.id,
    };
  }

  async awardSignupBonus(userId: string): Promise<void> {
    await this.addTokens({
      userId,
      amount: this.SIGNUP_BONUS,
      type: TokenTransactionType.signup_bonus,
      description: `Welcome bonus: ${this.SIGNUP_BONUS} tokens`,
    });
    
    tokenLogger.info({ userId, amount: this.SIGNUP_BONUS }, 'Signup bonus awarded');
  }

  async awardDailyLogin(userId: string): Promise<{ awarded: boolean; amount: number }> {
    // Check if user already logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransaction = await prisma.tokenTransaction.findFirst({
      where: {
        userId,
        type: TokenTransactionType.daily_login,
        createdAt: {
          gte: today,
        },
      },
    });

    if (todayTransaction) {
      tokenLogger.debug({ userId }, 'Daily login already awarded today');
      return { awarded: false, amount: 0 };
    }

    await this.addTokens({
      userId,
      amount: this.DAILY_LOGIN,
      type: TokenTransactionType.daily_login,
      description: `Daily login bonus: ${this.DAILY_LOGIN} tokens`,
    });

    tokenLogger.info({ userId, amount: this.DAILY_LOGIN }, 'Daily login bonus awarded');
    return { awarded: true, amount: this.DAILY_LOGIN };
  }

  async chargeForWebsiteGeneration(userId: string, websiteId: string): Promise<void> {
    await this.deductTokens({
      userId,
      amount: this.WEBSITE_GENERATION,
      type: TokenTransactionType.website_generation,
      description: `Website generation: ${this.WEBSITE_GENERATION} tokens`,
      metadata: { websiteId },
    });
  }

  async chargeForContentGeneration(userId: string, websiteId: string): Promise<void> {
    await this.deductTokens({
      userId,
      amount: this.CONTENT_GENERATION,
      type: TokenTransactionType.content_generation,
      description: `Content generation: ${this.CONTENT_GENERATION} tokens`,
      metadata: { websiteId },
    });
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    transactions: Array<{
      id: string;
      amount: number;
      type: TokenTransactionType;
      description: string;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.tokenTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.tokenTransaction.count({
        where: { userId },
      }),
    ]);

    return { transactions, total };
  }

  async hasEnoughTokens(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  getWebsiteGenerationCost(): number {
    return this.WEBSITE_GENERATION;
  }

  getContentGenerationCost(): number {
    return this.CONTENT_GENERATION;
  }
}

export const tokenManagerService = new TokenManagerService();