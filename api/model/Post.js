const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = mongoose.Schema({
	description: {
		type: String,
		required: true,
	},
	creatorId: {
		required: true,
		type: Schema.Types.ObjectId,
		ref: 'User',
	},

	date: {
		type: Date,
		default: Date.now,
	},
});

const postSchema = mongoose.Schema({
	// title: {
	//   type: String,
	//   required: true,
	// },

	description: {
		type: String,
		required: false,
	},
	creatorId: {
		required: true,
		type: Schema.Types.ObjectId,
		ref: 'User',
	},

	image: {
		type: String,
		required: false,
	},

	video: {
		type: String,
		required: false,
	},

	type: {
		type: String,
		enum: ['post', 'reel'],
		default: 'post',
	},

	date: {
		type: Date,
		default: Date.now,
	},

	likes: [
		{
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	],

	visibility: {
		type: String,
		enum: ['public', 'private'],
		default: 'public',
	},

	comments: [commentSchema],
});

module.exports = mongoose.model('Post', postSchema);
