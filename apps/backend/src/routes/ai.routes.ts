import { Router } from 'express';
import { generateWebsite, regenerateSection, streamGenerateWebsite } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { generateWebsiteSchema } from '../utils/validation';
import { strictRateLimiter } from '../middleware/rateLimit';

const router = Router();

// All routes require authentication and strict rate limiting
router.use(authenticate);
router.use(strictRateLimiter);

router.post('/generate-website', validateBody(generateWebsiteSchema), generateWebsite);
router.get('/generate-website/stream', streamGenerateWebsite);
router.post('/regenerate-section/:websiteId/:sectionId', regenerateSection);

export default router;