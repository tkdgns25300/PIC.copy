const express = require("express");
const router = express.Router();

// middleware
const checkToken = require("../middleware/checkToken");
//

router.post("/mail", controllers.sendMail);
router.post("/", controllers.signup);
router.post("/login", controllers.login);
router.post("/oauth/google", controllers.oauthGoogleLogin);
router.post("/oauth/naver", controllers.oauthNaverLogin);
router.post("/oauth/kakao", controllers.oauthKakaoLogin);
router.get("/logout", controllers.logout);
router.get("/auth/token", controllers.refreshToken);
router.post("/auth/token/validate", controllers.validateToken);
router.get("/:id", controllers.getUserInfo);
router.patch("/:id", checkToken, controllers.updateUserInfo);
router.delete("/:id", checkToken, controllers.deleteUser);
router.post("/email", controllers.checkEmail);
router.post("/nickname", controllers.checkNickname);
router.post("/:id/password", checkToken, controllers.checkPassword);

module.exports = router;
