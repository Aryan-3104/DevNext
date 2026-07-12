import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
	getMe,
	getProfile,
	updateProfile,
	getKarmaBreakdown,
	getUserPosts,
	getUserComments,
} from '../controllers/user.controller.js';

const router = Router();

// /me routes must be declared BEFORE /:username
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);

router.get('/:username', getProfile);
router.get('/:username/karma-breakdown', getKarmaBreakdown);
router.get('/:username/posts', getUserPosts);
router.get('/:username/comments', getUserComments);

export default router;
