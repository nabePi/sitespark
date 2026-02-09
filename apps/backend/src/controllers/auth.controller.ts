import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AuthenticatedRequest, Tokens } from '../types';
import { hashPassword, comparePassword, generateTokens, verifyRefreshToken } from '../utils/auth';
import { tokenManagerService } from '../services/token/tokenManager.service';
import { successResponse } from '../utils/response';
import { ConflictError, AuthenticationError, NotFoundError } from '../utils/errors';
import logger from '../config/logger';

const authLogger = logger.child({ component: 'AuthController' });

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Award signup bonus
    await tokenManagerService.awardSignupBonus(user.id);

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      tier: user.tier,
      tokensBalance: env.TOKENS_SIGNUP_BONUS,
    });

    authLogger.info({ userId: user.id }, 'User registered successfully');

    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        tokensBalance: env.TOKENS_SIGNUP_BONUS,
      },
      tokens,
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Award daily login bonus
    const dailyBonus = await tokenManagerService.awardDailyLogin(user.id);

    // Get updated balance
    const updatedBalance = await tokenManagerService.getBalance(user.id);

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      tier: user.tier,
      tokensBalance: updatedBalance,
    });

    authLogger.info({ 
      userId: user.id, 
      dailyBonusAwarded: dailyBonus.awarded,
      dailyBonusAmount: dailyBonus.amount 
    }, 'User logged in');

    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        tokensBalance: updatedBalance,
        dailyBonus: dailyBonus.awarded ? dailyBonus.amount : undefined,
      },
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Get current balance
    const tokensBalance = await tokenManagerService.getBalance(user.id);

    // Generate new tokens
    const tokens: Tokens = generateTokens({
      id: user.id,
      email: user.email,
      tier: user.tier,
      tokensBalance,
    });

    authLogger.debug({ userId: user.id }, 'Tokens refreshed');

    successResponse(res, { tokens });
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Refresh token expired'));
    } else {
      next(error);
    }
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        tokensBalance: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    successResponse(res, { user });
  } catch (error) {
    next(error);
  }
};