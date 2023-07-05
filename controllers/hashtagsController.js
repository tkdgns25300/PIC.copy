const Hashtag = require("../models/Hashtag");
const asyncWrapper = require("../middleware/async");

// 해시태그 생성
const createHashtags = asyncWrapper(async (req, res) => {
	const { category, content } = req.body;
	if (category && content) {
		await Hashtag.create(req.body);
		res.status(201).json({ message: "success" });
	} else {
		res.status(400).json({ message: "fail : require category and content" });
	}
});

// 해시태그 조회
const getHashtags = asyncWrapper(async (req, res) => {
	const hashtags = await Hashtag.find();
	res.status(200).json({
		hashtags,
		message: "success",
	});
});

module.exports = {
	createHashtags,
	getHashtags,
};
