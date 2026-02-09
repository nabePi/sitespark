import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { successResponse, paginatedResponse } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../config/logger';

const formLogger = logger.child({ component: 'FormController' });

export const submitForm = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { websiteId } = req.params;
    const { formName, data } = req.body;
    const ipAddress = req.ip;

    // Verify website exists
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      throw new NotFoundError('Website');
    }

    const submission = await prisma.formSubmission.create({
      data: {
        websiteId,
        formName,
        data,
        ipAddress,
      },
    });

    formLogger.info({ websiteId, formName }, 'Form submitted');

    successResponse(res, {
      message: 'Form submitted successfully',
      submissionId: submission.id,
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const listSubmissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { websiteId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const formName = req.query.formName as string;
    const skip = (page - 1) * limit;

    // Verify website ownership
    const website = await prisma.website.findFirst({
      where: { id: websiteId, userId },
    });

    if (!website) {
      throw new NotFoundError('Website');
    }

    const where: { websiteId: string; formName?: string } = { websiteId };
    if (formName) {
      where.formName = formName;
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.formSubmission.count({ where }),
    ]);

    paginatedResponse(res, submissions, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getFormStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { websiteId } = req.params;

    // Verify website ownership
    const website = await prisma.website.findFirst({
      where: { id: websiteId, userId },
    });

    if (!website) {
      throw new NotFoundError('Website');
    }

    const stats = await prisma.formSubmission.groupBy({
      by: ['formName'],
      where: { websiteId },
      _count: {
        id: true,
      },
    });

    const totalSubmissions = await prisma.formSubmission.count({
      where: { websiteId },
    });

    successResponse(res, {
      total: totalSubmissions,
      byForm: stats.map(s => ({
        formName: s.formName,
        count: s._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
};