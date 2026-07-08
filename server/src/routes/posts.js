import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireMembership } from '../middleware/membership.js';
import commentsRouter from './comments.js';
import {
	createPost,
	getPosts,
	getPostById,
	deletePost,
	updatePost,
	voteOnPost,
} from '../controllers/post.controller.js';

const router = express.Router();

router.post('/', protect, requireMembership, createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.delete('/:id', protect, deletePost);
router.patch('/:id', protect, updatePost);
router.post('/:id/vote', protect, voteOnPost);

// Nested: /api/posts/:postId/comments
router.use('/:postId/comments', commentsRouter);

export default router;
