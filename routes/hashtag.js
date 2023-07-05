const express = require("express");
const router = express.Router();

// middleware
//

router.post("/", controllers.createHashtags);
router.get("/", controllers.getHashtags);

module.exports = router;
