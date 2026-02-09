import { Router } from 'express';
import {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../controllers/blog.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createBlogPostSchema, updateBlogPostSchema } from '../utils/validation';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

router.get('/', listBlogPosts);
router.post('/', validateBody(createBlogPostSchema), createBlogPost);
router.get('/:id', getBlogPost);
router.put('/:id', validateBody(updateBlogPostSchema), updateBlogPost);
router.delete('/:id', deleteBlogPost);

export default router;