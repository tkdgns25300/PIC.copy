const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const asyncWrapper = require("../middleware/async");
const verifyToken = require("../utils/verifyToken");

// 댓글 추가
const addComment = asyncWrapper(async (req, res) => {
    const { description }  = req.body;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!description) {
        res.status(400).json({ message: "fail : require description" });
    } else if (!post) {
        res.status(400).json({ message: "fail : there's no post with the id" });
    } else {
        const userId = verifyToken(req.headers.authorization, "accessToken").id;
        const userNickname = await User.findById(userId).then(res => res.nickname);
        const newInfo = {
            author: userId,
            nickname: userNickname,
            description,
        };
        // DB에 댓글 추가 및 게시글 업데이트
        const comment = await Comment.create(newInfo);
        const newCommentsArray = post.comment;
        newCommentsArray.push(comment._id);
        await Post.updateOne(
            { _id: postId },
            {
                comment: newCommentsArray
            }
        );
        res.status(201).json({ message: "success" });
    }
})

// 댓글 조회
const readComment = asyncWrapper(async (req, res) => {
	const post = await Post.findById(req.params.id);
	if (!post) {
		res.status(400).json({ message: "fail : there's no post with the id" });
	} else {
		const postComments = post.comment;
		const allComments = await Comment.find();
		const filteredComments = allComments.filter((e) =>
			postComments.includes(e._id)
		);
		res.json({
			comments: filteredComments,
			message: "success",
		});
	}
});

// 댓글 수정
const modifyComment = asyncWrapper(async (req, res) => {
	const [description, postId, commentId] = [
		req.body.newDescription,
		req.params.id,
		req.params.commentId,
	];
	const post = await Post.findById(postId);
	const comment = await Comment.findById(commentId);
	if (!description) {
		res.status(400).json({ message: "fail : require description" });
	} else if (!post) {
		res.status(400).json({ message: "fail : there's no post with the id" });
	} else if (!comment || !post.comment.includes(commentId)) {
		res.status(400).json({ message: "fail : there's no comment with the id" });
	} else {
		await Comment.updateOne(
			{ _id: commentId },
			{ description },
			{ runValidators: true }
		);
		res.json({ message: "success" });
	}
});

// 댓글 삭제
const deleteComment = asyncWrapper(async (req, res) => {
	const [postId, commentId] = [req.params.id, req.params.commentId];
	const post = await Post.findById(postId);
	const comment = await Comment.findById(commentId);
	if (!post) {
		res.status(400).json({ message: "fail : there's no post with the id" });
	} else if (!comment || !post.comment.includes(commentId)) {
		res.status(400).json({ message: "fail : there's no comment with the id" });
	} else {
		const newCommentsArray = post.comment.filter((e) => e.toString() !== commentId);
		// Post, Comment DB에서 각각 삭제
		await Post.updateOne({ _id: postId }, { comment: newCommentsArray });
		await Comment.deleteOne({ _id: commentId });
		res.status(200).json({ message: "success" });
	}
});

module.exports = {
    addComment,
    readComment,
    modifyComment,
    deleteComment
}