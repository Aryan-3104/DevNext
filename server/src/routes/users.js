import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getMe } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', protect, getMe);

export default router;
