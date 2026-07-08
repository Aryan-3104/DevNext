import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
			scope: ['user:email', 'read:user'],
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Find user by githubId in MongoDB
				let user = await User.findOne({ githubId: profile.id });

				if (user) {
					return done(null, user);
				}

				// Safe extraction of avatar and email
				const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : undefined;
				const email = profile.emails && profile.emails[0] ? profile.emails[0].value : undefined;

				// Create a new user with the required fields
				user = await User.create({
					githubId: profile.id,
					username: profile.username || `github_${profile.id}`,
					avatar,
					email,
					githubUsername: profile.username,
				});

				return done(null, user);
			} catch (error) {
				return done(error, null);
			}
		},
	),
);

export default passport;
