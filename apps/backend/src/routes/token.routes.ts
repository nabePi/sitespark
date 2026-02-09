import { Router } from 'express';
import { getBalance, getTransactionHistory, addTokens } from '../controllers/token.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/balance', getBalance);
router.get('/history', getTransactionHistory);
router.post('/add', addTokens); // Admin only in production

export default router;