import mongoose from 'mongoose';

const codeBlockSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
		},
		language: {
			type: String,
			required: true,
		},
	},
	{ _id: false },
);

const postSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			maxlength: 150,
			trim: true,
		},
		body: {
			type: String,
		},
		codeBlocks: [codeBlockSchema],
		tags: {
			type: [String],
			validate: [
				{
					validator: function (val) {
						return val.length <= 5;
					},
					message: 'Tags array cannot exceed 5 items',
				},
			],
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		community: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Community',
			required: true,
		},
		upvotes: {
			type: Number,
			default: 0,
		},
		downvotes: {
			type: Number,
			default: 0,
		},
		score: {
			type: Number,
			default: 0,
		},
		commentCount: {
			type: Number,
			default: 0,
		},
		upvoters: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		downvoters: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		timestamps: true,
	},
);

postSchema.pre('validate', function () {
	const hasBody = typeof this.body === 'string' && this.body.trim().length > 0;
	const hasCodeBlocks = Array.isArray(this.codeBlocks) && this.codeBlocks.length > 0;
	if (!hasBody && !hasCodeBlocks) {
		this.invalidate('body', 'Either body or codeBlocks must be present');
	}
});

const Post = mongoose.model('Post', postSchema);

export default Post;
