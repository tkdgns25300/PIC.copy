const express = require("express");
const router = express.Router();

// Routers
const userRouter = require("./userRouter");
const postRouter = require("./postRouter");
const commentRouter = require("./commentRouter");
const hashtagsRouter = require("./hashtagsRouter");

router.use("/users", userRouter);
router.use("/posts", postRouter);
router.use("/posts", commentRouter);
router.use("/hashtags", hashtagsRouter);

module.exports = router;
