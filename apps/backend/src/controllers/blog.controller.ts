import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { generateSlug } from '../utils/auth';
import { successResponse, paginatedResponse } from '../utils/response';
import { NotFoundError, ConflictError } from '../utils/errors';
import logger from '../config/logger';

const blogLogger = logger.child({ component: 'BlogController' });

export const listBlogPosts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { websiteId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Verify website ownership
    const website = await prisma.website.findFirst({
      where: { id: websiteId, userId },
    });

    if (!website) {
      throw new NotFoundError('Website');
    }

    const where: { websiteId: string; status?: { in: string[] } | string } = { websiteId };
    if (status) {
      where.status = status;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    paginatedResponse(res, posts, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getBlogPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { websiteId, id } = req.params;
    const userId = req.user?.id;

    // Verify website ownership
    const website = await prisma.website.findFirst({
      where: { id: websiteId, userId },
    });

    if (!website) {
      throw new NotFoundError('Website');
    }

    const post = await prisma.blogPost.findFirst({
      where: { id, websiteId },
    });

    if (!post) {
      throw new NotFoundError('Blog post');
    }

    successResponse(res, { post });
  } catch (error) {
    next(error);
  }
};

export const createBlogPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { websiteId, title, content, excerpt, coverImage, status } = req.body;

    // Verify website ownership
    const website = await prisma.website.findFirst({
      where: { id: websiteId, userId },
    });

    if (!website) {
      throw new NotFoundError('Website');
    }

    const slug = generateSlug(title);

    // Check if slug is unique for this website
    const existing = await prisma.blogPost.findUnique({
      where: { websiteId_slug: { websiteId, slug } },
    });

    if (existing) {
      throw new ConflictError('A post with this title already exists');
    }

    const post = await prisma.blogPost.create({
      data: {
        websiteId,
        title,
        slug: `${slug}-${Date.now()}`,
        content,
        excerpt: excerpt || content.substring(0, 200),
        coverImage,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    blogLogger.info({ userId, websiteId, postId: post.id }, 'Blog post created');

    successResponse(res, { post }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateBlogPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, content, excerpt, coverImage, status } = req.body;

    // Find post and verify ownership
    const post = await prisma.blogPost.findFirst({
      where: { id },
      include: { website: true },
    });

    if (!post || post.website.userId !== userId) {
      throw new NotFoundError('Blog post');
    }

    const updateData: Record<string, unknown> = {};
    
    if (title) {
      updateData.title = title;
      updateData.slug = generateSlug(title);
    }
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (status) {
      updateData.status = status;
      if (status === 'published' && post.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });

    blogLogger.info({ userId, postId: id }, 'Blog post updated');

    successResponse(res, { post: updatedPost });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Find post and verify ownership
    const post = await prisma.blogPost.findFirst({
      where: { id },
      include: { website: true },
    });

    if (!post || post.website.userId !== userId) {
      throw new NotFoundError('Blog post');
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    blogLogger.info({ userId, postId: id }, 'Blog post deleted');

    successResponse(res, { message: 'Blog post deleted successfully' });
  } catch (error) {
    next(error);
  }
};