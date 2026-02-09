import { Router } from 'express';
import { register, login, refresh, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshTokenSchema), refresh);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;