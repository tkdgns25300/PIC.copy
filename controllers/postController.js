const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const asyncWrapper = require("../middleware/async");
const verifyToken = require("../utils/verifyToken");

// 게시글 업로드
const uploadPost = asyncWrapper(async (req, res) => {
    const { title, photo, location } = req.body;
    if (title && photo && location) {
        const data = verifyToken(req.headers.authorization, "accessToken");
		req.body.author = data.id;
		req.body.nickname = await User.findById(data.id).then((res) => res.nickname);
        await Post.create(req.body);
		res.status(201).json({ message: "success" });
    } else {
        res.status(400).json({ message: "fail : all required fields are not filled in" });
    }
})

// 해당 게시글 조회
const getSinglePost = asyncWrapper(async (req, res) => {
	const post = await Post.findById(req.params.id);
	if (!post) {
		res.status(400).json({ message: "fail : there's no post with the id" });
	} else {
		res.status(200).json({
			post,
			message: "success",
		});
	}
});

// 필터링 후 모든 게시글 조회
const getAllPosts = asyncWrapper(async (req, res) => {
    if (!level) {
		res.status(400).json({ message: "fail : require level variable in query" });
	} else if (mypost && bookmark) {
		res.status(400).json({ message: "fail : use only one query - mypost OR bookmark" });
	} else if (like && date) {
		res.status(400).json({ message: "fail : use only one query - like OR date" });
	} else {
		let posts = await Post.find();

		// mypost(내가 적은 게시글) 필터링
		if (mypost) {
			posts = posts.filter((post) => String(post.author) === mypost);
		}

		// bookmark(즐겨찾기) 필터링
		else if (bookmark) {
			posts = posts.filter((post) => post.likes.includes(bookmark));
		}

		// hashtag 필터링
		if (hashtags) {
			filterHashtags = hashtags.split(",").map((e) => (e[0] === " " ? e.slice(1) : e));
			posts = posts.filter((post) => {
				const allTags = [...post.hashtags.keywords, ...post.hashtags.myTags];
				return isSubsetOf(allTags, filterHashtags);
			});
		}

		// distance 필터링
		if (distance && center) {
			const [centerX, centerY] = center
				.slice(1, center.length - 1)
				.split(",")
				.map((e) => (e[0] === " " ? Number(e.slice(1)) : Number(e)));
			posts = posts.filter((post) =>
				getIncluded(
					centerX,
					centerY,
					Number(post.location.latitude),
					Number(post.location.longitude),
					Number(distance)
				)
			);
		}

		// 좋아요 순으로 정렬
		if (like) {
			posts.sort((a, b) => b.likes.length - a.likes.length);
		} 

		// 최신날짜 순으로 정렬
		else if (date) {
			posts.sort((a, b) => b.createdAt - a.createdAt);
		}

		// Level에 따라 자르기
		posts = posts.slice(12 * (Number(level) - 1), 12 * (Number(level) - 1) + 12);

		res.status(200).json({
			posts,
			message: "success",
		});
	}
});

// 게시글 업데이트
const updatePost = asyncWrapper(async (req, res) => {
	const { newTitle, newDescription, newPhoto, newLocation, newHashtags } =
		req.body;
	if (newTitle || newDescription || newPhoto || newLocation || newHashtags) {
		const post = await Post.findById(req.params.id);
		if (!post) {
			res.status(400).json({ message: "fail : there's no post with the id" });
		} else {
			const newInfo = {
				title: newTitle,
				description: newDescription,
				photo: newPhoto,
				location: newLocation,
				hashtags: newHashtags,
			};
			await Post.updateOne({ _id: req.params.id }, newInfo, {
				runValidators: true,
			});
			res.status(200).json({ message: "success" });
		}
	} else {
		// request의 body에 수정할 값이 하나도 들어있지 않을 경우
		res
			.status(400)
			.json({ message: "fail : none of the fields are in the request" });
	}
});

// 게시글 삭제
const deletePost = asyncWrapper(async (req, res) => {
	const postId = req.params.id;
	const post = await Post.findById(postId);
	if (!post) {
		res.status(400).json({ message: "fail : there's no post with the id" });
	} else {
		// 게시글 삭제
		await Post.deleteOne({ _id: postId });
		// 관련 댓글 삭제
		post.comment.forEach(async (commentId) => {
			await Comment.findByIdAndDelete(commentId);
		});
		// 유저의 favorite에 해당 게시글 id 삭제
		post.likes.forEach(async (userId) => {
			const userInfo = await User.findById(userId);
			const newFavoriteArray = userInfo.favorite.filter(
				(e) => e.toString() !== postId
			);
			await User.updateOne({ _id: userId }, { favorite: newFavoriteArray });
		});
		res.status(200).json({ message: "success" });
	}
});

// 게시글 좋아요 토글
const toggleLike = asyncWrapper(async (req, res) => {
	const userId = verifyToken(req.headers.authorization, "accessToken").id;
	const postId = req.params.id;
	const post = await Post.findById(postId);
	const userInfo = await User.findById(userId);
	if (!post) {
		res.status(400).json({ message: "fail : there's no post with the id" });
	} else {
		const oldLikesArray = post.likes;
		let newLikesArray;
		const oldFavoriteArray = userInfo.favorite;
		let newFavoriteArray;
		let oldLikes = await User.findById(post.author).then(res => res.likes);
		if (oldLikesArray.includes(userId)) {
			newLikesArray = oldLikesArray.filter((e) => e.toString() !== userId);
			newFavoriteArray = oldFavoriteArray.filter((e) => e.toString() !== postId);
			oldLikes--;
		} else {
			oldLikesArray.push(userId);
			newLikesArray = oldLikesArray;
			oldFavoriteArray.push(postId);
			newFavoriteArray = oldFavoriteArray;
			oldLikes++;
		}
		// DB에 추가
		await Post.updateOne({ _id: postId }, {	likes: newLikesArray });
		await User.updateOne({ _id: userId }, {	favorite: newFavoriteArray });
		await User.updateOne({ _id: post.author }, { likes: oldLikes })
		res.status(200).json({ message: "success" });
	}
});


module.exports = {
	uploadPost,
	getSinglePost,
	getAllPosts,
	updatePost,
	deletePost,
	toggleLike,
};
