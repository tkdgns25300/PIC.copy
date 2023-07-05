const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
	{
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		nickname: {
			type: String,
			trim: true,
			unique: [true, "the nickname already exist"],
			required: [true, "must provide nickname"],
		},
		title: {
			type: String,
			trim: true,
			required: [true, "must provide title"],
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		photo: {
			type: String,
			required: [true, "must provide photo"],
		},
		location: {
			type: mongoose.Schema.Types.Mixed,
			required: [true, "must provide location"],
		},
		hashtags: {
			type: mongoose.Schema.Types.Mixed,
			default: {
				keywords: [],
				myTags: [],
			},
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		comment: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Post", PostSchema);
