import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createWebsiteSchema = z.object({
  name: z.string().min(1, 'Website name is required').max(100),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be at most 63 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
});

export const generateWebsiteSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000),
  name: z.string().min(1, 'Website name is required').max(100),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be at most 63 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
});

export const updateWebsiteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  config: z.record(z.unknown()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const createBlogPostSchema = z.object({
  websiteId: z.string().uuid('Invalid website ID'),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const submitFormSchema = z.object({
  formName: z.string().default('contact'),
  data: z.record(z.unknown()),
});

export const tokenOperationSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
});