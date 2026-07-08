import express from 'express';
import { protect } from '../middleware/auth.js';
import {
	createComment,
	getComments,
	voteOnComment,
	deleteComment,
} from '../controllers/comment.controller.js';

/**
 * Comments are mounted as nested routes under posts:
 *   POST   /api/posts/:postId/comments                    – JWT required
 *   GET    /api/posts/:postId/comments                    – public
 *   POST   /api/posts/:postId/comments/:commentId/vote   – JWT required
 *   DELETE /api/posts/:postId/comments/:commentId        – JWT required
 *
 * { mergeParams: true } exposes :postId from the parent posts router.
 */
const router = express.Router({ mergeParams: true });

router.post('/', protect, createComment);
router.get('/', getComments);
router.post('/:commentId/vote', protect, voteOnComment);
router.delete('/:commentId', protect, deleteComment);

export default router;

