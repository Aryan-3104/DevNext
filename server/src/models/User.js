import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pinnedRepoSchema = new mongoose.Schema(
	{
		name: String,
		url: String,
		description: String,
		language: String,
	},
	{ _id: false },
);

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		email: {
			type: String,
			unique: true,
			sparse: true,
		},
		passwordHash: {
			type: String,
		},
		githubId: {
			type: String,
			unique: true,
			sparse: true,
		},
		githubUsername: {
			type: String,
		},
		avatar: {
			type: String,
		},
		bio: {
			type: String,
			default: '',
			maxlength: 300,
		},
		location: {
			type: String,
			maxlength: 100,
			default: '',
		},
		karma: {
			type: Number,
			default: 0,
		},
		pinnedRepos: [pinnedRepoSchema],
		communities: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Community',
			},
		],
	},
	{
		timestamps: true,
	},
);

userSchema.methods.comparePassword = function comparePassword(plain) {
	return bcrypt.compare(plain, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

export default User;
