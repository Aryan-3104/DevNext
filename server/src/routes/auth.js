import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { login, register } from '../controllers/auth.controller.js';

const router = Router();

// ── Local auth ────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

// ── GitHub OAuth ──────────────────────────────────────────────

// Step 1: Redirect the user to GitHub for authorisation
router.get('/github', passport.authenticate('github', { session: false }));

// Step 2: GitHub redirects back here after the user authorises
router.get(
	'/github/callback',
	passport.authenticate('github', {
		session: false,
		failureRedirect: '/login',
	}),
	(req, res) => {
		// req.user is the Mongoose document returned by the strategy's done()
		const token = jwt.sign(
			{ userId: req.user._id.toString() },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN },
		);

		// Send the JWT to the client via a query-param redirect
		res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
	},
);

export default router;
