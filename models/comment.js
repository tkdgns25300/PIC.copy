const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        nickname: {
            type: String,
            trim: true,
            unique: [true, "the nickname already exist"],
            required: [true, "must provide nickname"],
        },
        description: {
			type: String,
			trim: true,
			required: [true, "must provide description"],
		},
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Comment", CommentSchema);