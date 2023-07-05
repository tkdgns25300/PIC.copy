const express = require("express");
const router = express.Router();

// middleware
const checkToken = require("../middleware/checkToken");
const controllers = require("../controllers/commentController");

router.post("/:id/comments", checkToken, controllers.addComment);
router.get("/:id/comments", controllers.readComment);
router.patch("/:id/comments/:commentId", checkToken, controllers.modifyComment);
router.delete("/:id/comments/:commentId", checkToken, controllers.deleteComment);

module.exports = router;