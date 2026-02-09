import { Router } from 'express';
import {
  listWebsites,
  getWebsite,
  createWebsite,
  updateWebsite,
  deleteWebsite,
  generateWebsite,
} from '../controllers/website.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createWebsiteSchema, updateWebsiteSchema, generateWebsiteSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', listWebsites);
router.post('/', validateBody(createWebsiteSchema), createWebsite);
router.post('/generate', validateBody(generateWebsiteSchema), generateWebsite);
router.get('/:id', getWebsite);
router.put('/:id', validateBody(updateWebsiteSchema), updateWebsite);
router.delete('/:id', deleteWebsite);

export default router;