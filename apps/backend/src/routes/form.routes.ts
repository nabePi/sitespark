import { Router } from 'express';
import { submitForm, listSubmissions, getFormStats } from '../controllers/form.controller';
import { optionalAuth, authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { submitFormSchema } from '../utils/validation';
import { strictRateLimiter } from '../middleware/rateLimit';

const router = Router({ mergeParams: true });

// Public form submission (rate limited)
router.post('/submit', strictRateLimiter, validateBody(submitFormSchema), submitForm);

// Protected routes for viewing submissions
router.use(authenticate);

router.get('/submissions', listSubmissions);
router.get('/stats', getFormStats);

export default router;