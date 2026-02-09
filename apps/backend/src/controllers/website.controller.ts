import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { websitePipelineService } from '../services/website/websitePipeline.service';
import { tokenManagerService } from '../services/token/tokenManager.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { NotFoundError, ConflictError, AuthorizationError } from '../utils/errors';
import logger from '../config/logger';

const websiteLogger = logger.child({ component: 'WebsiteController' });

export const listWebsites = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [websites, total] = await Promise.all([
      prisma.website.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          subdomain: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              blogPosts: true,
              formSubmissions: true,
            },
          },
        },
      }),
      prisma.website.count({
        where: { userId },
      }),
    ]);

    paginatedResponse(res, websites, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const website = await prisma.website.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            blogPosts: true,
            formSubmissions: true,
          },
        },
      },
    });

    if (!website) {
      throw new NotFoundError('Website');
    }

    successResponse(res, { website });
  } catch (error) {
    next(error);
  }
};

export const createWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, subdomain, description } = req.body;

    // Check if subdomain is available
    const existing = await prisma.website.findUnique({
      where: { subdomain },
    });

    if (existing) {
      throw new ConflictError('Subdomain already taken');
    }

    const website = await prisma.website.create({
      data: {
        name,
        subdomain,
        description,
        userId: userId!,
        config: {},
        status: 'draft',
      },
    });

    websiteLogger.info({ userId, websiteId: website.id }, 'Website created');

    successResponse(res, { website }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, config, status } = req.body;

    // Check ownership
    const existing = await prisma.website.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Website');
    }

    const website = await prisma.website.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(config && { config }),
        ...(status && { status }),
        ...(status === 'published' && { publishedAt: new Date() }),
      },
    });

    websiteLogger.info({ userId, websiteId: id }, 'Website updated');

    successResponse(res, { website });
  } catch (error) {
    next(error);
  }
};

export const deleteWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.website.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Website');
    }

    await prisma.website.delete({
      where: { id },
    });

    websiteLogger.info({ userId, websiteId: id }, 'Website deleted');

    successResponse(res, { message: 'Website deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const generateWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { prompt, name, subdomain, description } = req.body;

    // Check if user has enough tokens
    const hasEnough = await tokenManagerService.hasEnoughTokens(
      userId!,
      tokenManagerService.getWebsiteGenerationCost()
    );

    if (!hasEnough) {
      throw new AuthorizationError('Insufficient tokens for website generation');
    }

    // Check if subdomain is available
    const existing = await prisma.website.findUnique({
      where: { subdomain },
    });

    if (existing) {
      throw new ConflictError('Subdomain already taken');
    }

    // Create website in generating state
    const website = await prisma.website.create({
      data: {
        name,
        subdomain,
        description,
        userId: userId!,
        config: {},
        status: 'generating',
      },
    });

    websiteLogger.info({ userId, websiteId: website.id }, 'Starting website generation');

    // Charge tokens
    await tokenManagerService.chargeForWebsiteGeneration(userId!, website.id);

    // Generate website (this could be async for large generations)
    const result = await websitePipelineService.generateWebsite({
      userId: userId!,
      prompt,
      subdomain,
      name,
      description,
    });

    // Update website with generated content
    const updatedWebsite = await prisma.website.update({
      where: { id: website.id },
      data: {
        generatedHtml: result.html,
        generatedCss: result.css,
        config: result.config,
        status: 'draft',
        aiModel: 'kimi-k2',
      },
    });

    websiteLogger.info({ userId, websiteId: website.id }, 'Website generation completed');

    successResponse(res, {
      website: updatedWebsite,
      previewUrl: `${req.protocol}://${subdomain}.${req.headers.host}`,
    });
  } catch (error) {
    next(error);
  }
};