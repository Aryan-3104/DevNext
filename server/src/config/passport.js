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

				// Fetch top 5 GitHub repos by stars and save them
				try {
					const reposResponse = await fetch('https://api.github.com/user/repos?sort=stars&direction=desc&per_page=5', {
						headers: {
							Authorization: `token ${accessToken}`,
							'User-Agent': 'DevNest-App',
						},
					});
					if (reposResponse.ok) {
						const reposData = await reposResponse.json();
						if (Array.isArray(reposData)) {
							user.pinnedRepos = reposData.map((repo) => ({
								name: repo.name,
								url: repo.html_url,
								description: repo.description || '',
								language: repo.language || '',
							}));
							await user.save();
						}
					} else {
						console.error(`GitHub API returned status ${reposResponse.status} while fetching repos`);
					}
				} catch (repoError) {
					console.error('Failed to fetch pinned repos from GitHub:', repoError);
				}

				return done(null, user);
			} catch (error) {
				return done(error, null);
			}
		},
	),
);

export default passport;
