import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			unique: true,
			lowercase: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		avatar: {
			type: String,
			default: '',
		},
		members: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		moderators: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		rules: [
			{
				type: String,
			},
		],
		postCount: {
			type: Number,
			default: 0,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{
		timestamps: true,
	},
);

communitySchema.pre('save', function () {
	if (this.isModified('name')) {
		this.slug = this.name
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}
});

const Community = mongoose.model('Community', communitySchema);

export default Community;
