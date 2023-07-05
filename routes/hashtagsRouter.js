const express = require("express");
const router = express.Router();

// middleware
const controllers = require("../controllers/hashtagsController");

router.post("/", controllers.createHashtags);
router.get("/", controllers.getHashtags);

module.exports = router;
