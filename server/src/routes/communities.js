import express from 'express';
import { protect } from '../middleware/auth.js';
import {
	createCommunity,
	getCommunities,
	getCommunityBySlug,
	joinCommunity,
	leaveCommunity,
	deleteCommunity,
} from '../controllers/community.controller.js';

const router = express.Router();

router.post('/', protect, createCommunity);
router.get('/', getCommunities);
router.get('/:slug', getCommunityBySlug);
router.post('/:slug/join', protect, joinCommunity);
router.post('/:slug/leave', protect, leaveCommunity);
router.delete('/:slug', protect, deleteCommunity);

export default router;
