import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, WebsiteGenerationInput } from '../types';
import { websitePipelineService } from '../services/website/websitePipeline.service';
import { tokenManagerService } from '../services/token/tokenManager.service';
import { successResponse } from '../utils/response';
import { NotFoundError, ConflictError, AuthorizationError } from '../utils/errors';
import logger from '../config/logger';

const aiLogger = logger.child({ component: 'AIController' });

export const generateWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { prompt, name, subdomain, description } = req.body;

    // Check tokens
    const hasEnough = await tokenManagerService.hasEnoughTokens(
      userId!,
      tokenManagerService.getWebsiteGenerationCost()
    );

    if (!hasEnough) {
      throw new AuthorizationError('Insufficient tokens for website generation');
    }

    aiLogger.info({ userId, prompt: prompt.substring(0, 50) }, 'AI website generation requested');

    // Note: In production, this would queue the job and return immediately
    // For now, we do synchronous generation
    const result = await websitePipelineService.generateWebsite({
      userId: userId!,
      prompt,
      subdomain,
      name,
      description,
    });

    successResponse(res, {
      generated: true,
      intent: result.intent,
      content: {
        title: result.content.title,
        headline: result.content.headline,
        sections: result.content.sections.length,
      },
      design: {
        primaryColor: result.content.seo.keywords[0],
      },
      html: result.html.substring(0, 500) + '...',
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateSection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { websiteId, sectionId } = req.params;
    const { prompt } = req.body;

    // Check tokens for content generation
    const hasEnough = await tokenManagerService.hasEnoughTokens(
      userId!,
      tokenManagerService.getContentGenerationCost()
    );

    if (!hasEnough) {
      throw new AuthorizationError('Insufficient tokens for content generation');
    }

    // Charge tokens
    await tokenManagerService.deductTokens({
      userId: userId!,
      amount: tokenManagerService.getContentGenerationCost(),
      type: 'content_generation',
      description: 'Section regeneration',
      metadata: { websiteId, sectionId },
    });

    const result = await websitePipelineService.regenerateContent(websiteId, sectionId, prompt);

    successResponse(res, {
      regenerated: true,
      sectionId,
      content: result.content,
    });
  } catch (error) {
    next(error);
  }
};

export const streamGenerateWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const input: WebsiteGenerationInput = {
      userId: userId!,
      ...req.body,
    };

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendProgress({ type: 'start', message: 'Starting generation...' });

    // Stream progress updates
    const result = await websitePipelineService.generateWebsite(input, (progress) => {
      sendProgress({ type: 'progress', ...progress });
    });

    sendProgress({ type: 'complete', result });
    res.end();
  } catch (error) {
    next(error);
  }
};