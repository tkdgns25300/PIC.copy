const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const asyncWrapper = require("../middleware/async");
const findWithPassword = require("../utils/findWithPassword");
const generateToken = require("../utils/generateToken");
const verifyToken = require("../utils/verifyToken");
const bcrypt = require("bcrypt");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
var appDir = path.dirname(require.main.filename);

// 이메일 인증
const sendMail = asyncWrapper(async (req, res) => {
	const { email } = req.body;
	if (!email) {
		res.json({ message: "require email" });
	} else {
		const authNum = String(Math.random()).split("").slice(2, 8).join("");
		let emailTemplate;
		ejs.renderFile(
			appDir + "/template/authMail.ejs",
			{ authCode: authNum },
			function (err, data) {
				if (err) throw err;
				emailTemplate = data;
			}
		);

		let transporter = nodemailer.createTransport({
			service: "gmail",
			host: "smtp.gmail.com",
			port: 587,
			auth: {
				user: process.env.NODEMAILER_USER,
				pass: process.env.NODEMAILER_PASS,
			},
		});

		let mailOptions = {
			from: "PIC.",
			to: email,
			subject: "회원가입을 위한 인증번호를 입력해주세요.",
			html: emailTemplate,
		};

		transporter.sendMail(mailOptions, (err, info) => {
			if (err) throw err;
			res.json({
				authNum: authNum,
				message: "success",
			});
			transporter.close();
		});
	}
});

// 회원 가입
const signup = asyncWrapper(async (req, res) => {
	const { email, password, nickname } = req.body;
	if (email && password && nickname) {
		await User.create(req.body);
		res.status(201).json({ message: "success" });
	} else {
		res
			.status(400)
			.json({ message: "fail : require email, password, and nickname" });
	}
});

// 일반 로그인
const login = asyncWrapper(async (req, res) => {
	const { email, password } = req.body;
	if (email && password) {
		const userInfo = await findWithPassword({ email }, password);
		if (!userInfo) {
			// 해당 User가 없는 경우
			res.status(401).json({
				message: "fail : there is no user with that email and password",
			});
		} else {
			const accessToken = generateToken(userInfo, "accessToken");
			const refreshToken = generateToken(userInfo, "refreshToken");
			res.cookie("refreshToken", refreshToken, {
				httpOnly: true,
				path: "/api/users/auth/token",
				maxAge: 60 * 60 * 24 * 7,
			});

			res.json({
				_id: userInfo._id,
				accessToken,
				message: "success",
			});
		}
	} else {
		// email과 password가 둘 중 하나라도 요청에 있지 않은 경우
		res.status(400).json({ message: "fail : require email and password" });
	}
});

// OAuth 2.0 구글 로그인
const oauthGoogleLogin = asyncWrapper(async (req, res) => {
	const { idToken } = req.body;
	if (!idToken) {
		// id token이 전달되지 않았을 경우
		res.status(400).json({ message: "fail : require idToken" });
	} else {
		const { OAuth2Client } = require("google-auth-library");
		const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
		const client = new OAuth2Client(CLIENT_ID);
		const ticket = await client.verifyIdToken({
			idToken: idToken,
			audience: CLIENT_ID,
		});
		const payload = ticket.getPayload();

		// DB에 넣을 값 생성
		const email = payload.email + "-Google";
		const nickname = payload.name + String(Math.random()).slice(2, 8);
		const password = process.env.SOCIAL_LOGIN_PASSWORD;
		const image = payload.picture;

		// DB에 추가
		let userInfo = await User.findOne({ email });
		if (!userInfo) {
			// 처음 소셜로그인 하는 경우
			userInfo = await User.create({ email, nickname, password, image });
		}
		const accessToken = generateToken(userInfo, "accessToken");
		const refreshToken = generateToken(userInfo, "refreshToken");
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			path: "/api/users/auth/token",
			maxAge: 60 * 60 * 24 * 7,
		});

		res.json({
			_id: userInfo._id,
			accessToken,
			message: "success",
		});
	}
});

// OAuth 2.0 네이버 로그인
const oauthNaverLogin = asyncWrapper(async (req, res) => {
	const { code, state } = req.body;
	if (code && state) {
		const response = await fetch(
			`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`
		).then((res) => res.json());
		const naverAccessToken = response.access_token;
		const naverUserInfo = await fetch(`https://openapi.naver.com/v1/nid/me`, {
			headers: {
				Authorization: `Bearer ${naverAccessToken}`,
			},
		}).then((res) => res.json());

		// DB에 넣을 값 생성
		const email = naverUserInfo.response.email + "-Naver";
		const nickname = naverUserInfo.response.nickname + String(Math.random()).slice(2, 8);
		const password = process.env.SOCIAL_LOGIN_PASSWORD;
		const image = naverUserInfo.response.profile_image;

		// DB에 추가
		let userInfo = await User.findOne({ email });
		if (!userInfo) {
			// 처음 소셜로그인 하는 경우
			userInfo = await User.create({ email, nickname, password, image });
		}
		const accessToken = generateToken(userInfo, "accessToken");
		const refreshToken = generateToken(userInfo, "refreshToken");
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			path: "/api/users/auth/token",
			maxAge: 60 * 60 * 24 * 7,
		});

		res.json({
			_id: userInfo._id,
			accessToken,
			message: "success",
		});
	} else {
		// authorization code 또는 state가 전달되지 않았을 경우
		res
			.status(400)
			.json({ message: "fail : require authorization code and state" });
	}
});

// OAuth 2.0 카카오 로그인
const oauthKakaoLogin = asyncWrapper(async (req, res) => {
	const { code } = req.body;
	if (!code) {
		// authorization code가 전달되지 않았을 경우
		res.status(400).json({ message: "fail : require authorization code" });
	} else {
		const response = await fetch("https://kauth.kakao.com/oauth/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				client_id: process.env.KAKAO_CLIENT_ID,
				client_secret: process.env.KAKAO_CLIENT_SECRET,
				redirect_uri: process.env.KAKAO_REDIRECT_URI,
				code: code,
			}),
		}).then((res) => res.json());
		const kakaoAccessToken = response.access_token;
		const kakaoUserInfo = await fetch(`https://kapi.kakao.com/v2/user/me`, {
			headers: {
				Authorization: `Bearer ${kakaoAccessToken}`,
			},
		}).then((res) => res.json());

		// DB에 넣을 값 생성
		const email = kakaoUserInfo.kakao_account.email ? kakaoUserInfo.kakao_account.email + "-Kakao" : "user" + String(Math.random()).slice(2, 8) + "-Kakao";
		const nickname = kakaoUserInfo.kakao_account.profile.nickname + String(Math.random()).slice(2, 8);
		const password = process.env.SOCIAL_LOGIN_PASSWORD;
		const image = kakaoUserInfo.kakao_account.profile.profile_image_url;

		// DB에 추가
		let userInfo = await User.findOne({ email });
		if (!userInfo) {
			// 처음 소셜로그인 하는 경우
			userInfo = await User.create({ email, nickname, password, image });
		}
		const accessToken = generateToken(userInfo, "accessToken");
		const refreshToken = generateToken(userInfo, "refreshToken");
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			path: "/api/users/auth/token",
			maxAge: 60 * 60 * 24 * 7,
		});

		res.json({
			_id: userInfo._id,
			accessToken,
			message: "success",
		});
	}
});

// 로그아웃
const logout = asyncWrapper(async (req, res) => {
	res.clearCookie("refreshToken", { path: "/api/users/refresh-token" });
	res.json({ message: "success" });
});

// 리프레시토큰을 이용한 액세스토큰 재발급
const refreshToken = asyncWrapper(async (req, res) => {
	const refreshToken = req.cookies.refreshToken;
	if (!refreshToken) {
		res.status(400).json({ message: "fail : require refresh token" });
	} else {
		const data = verifyToken(refreshToken, "refreshToken");
		if (data === "fail") {
			res.status(400).json({ message: "fail : invalid refresh token" });
		} else {
			const accessToken = generateToken({ _id: data.id }, "accessToken");
			res.json({
				accessToken,
				message: "success",
			});
		}
	}
});

// 액세스토큰 유효여부 확인
const validateToken = asyncWrapper(async (req, res) => {
	const { token } = req.body;
	if (!token) {
		res.status(400).json({ message: "fail : require token" });
	} else {
		const data = verifyToken(token, "accessToken");
		if (data === "fail") {
			res.status(200).json({
				valid: false,
				message: "success"
			});
		} else {
			res.status(200).json({
				valid: true,
				message: "success"
			});
		}
	}
})

// 사용자 정보 조회
const getUserInfo = asyncWrapper(async (req, res) => {
	const userInfo = await User.findById(req.params.id).select("-password");
	if (!userInfo) {
		res.status(400).json({ message: "fail : invalid user id" });
	} else {
		res.status(200).json({
			userInfo,
			message: "success",
		});
	}
});

// 사용자 정보 업데이트
const updateUserInfo = asyncWrapper(async (req, res) => {
	const { newNickname, newPassword, newImage } = req.body;
	if (newNickname || newPassword || newImage) {
		const userInfo = await User.findById(req.params.id);
		if (!userInfo) {
			res.status(400).json({ message: "fail : invalid user id" });
		} else {
			const newInfo = {
				nickname: newNickname,
				image: newImage,
			};
			if (newPassword) {
				const salt = await bcrypt.genSalt();
				newInfo.password = await bcrypt.hash(newPassword, salt);
			}
			await User.updateOne({ _id: req.params.id }, newInfo, {
				runValidators: true,
			});
			if (newNickname) {
				await Post.updateMany({ author: req.params.id }, { nickname: newNickname });
				await Comment.updateMany({ author: req.params.id }, { nickname: newNickname });
			}
			res.status(200).json({ message: "success" });
		}
	} else {
		// newNickname, newPassword, newImage 셋 다 request에 없을 경우
		res
			.status(400)
			.json({ message: "fail : require nickname or password or image" });
	}
});

// 회원 탈퇴
const deleteUser = asyncWrapper(async (req, res) => {
	const userInfo = await User.findById(req.params.id);
	if (!userInfo) {
		res.status(400).json({ message: "fail : invalid user id" });
	} else {
		// 유저 삭제
		await User.deleteOne({ _id: req.params.id });

		const userAllPosts = await Post.find({ author: req.params.id });
		userAllPosts.forEach(async (post) => {
			const postId = post._id;
			// 내가 작성한 게시글 삭제
			await Post.deleteOne({ _id: postId });
			// 게시글에 포함되어 있던 댓글들 삭제
			post.comment.forEach(async (commentId) => {
				await Comment.findByIdAndDelete(commentId);
			});
			// 유저의 favorite에 해당 게시글의 id 삭제
			post.likes.forEach(async (userId) => {
				const userInfo = await User.findById(userId);
				const newFavoriteArray = userInfo.favorite.filter(
					(e) => e.toString() !== postId.toString()
				);
				await User.updateOne({ _id: userId }, { favorite: newFavoriteArray });
			});
		});
		res.status(200).json({ message: "success" });
	}
});

// 이메일 중복확인
const checkEmail = asyncWrapper(async (req, res) => {
	const { email } = req.body;
	if (!email) {
		// email이 전달되지 않았을 경우
		res.status(400).json({ message: "fail : require email" });
	} else {
		const userInfo = await User.findOne({ email });
		if (userInfo) {
			// email이 중복되는 경우
			res.status(400).json({ message: "fail : email exist" });
		} else {
			res.status(200).json({ message: "success : valid email" });
		}
	}
});

// 닉네임 중복확인
const checkNickname = asyncWrapper(async (req, res) => {
	const { nickname } = req.body;
	if (!nickname) {
		// nickname이 전달되지 않았을 경우
		res.status(400).json({ message: "fail : require nickname" });
	} else {
		const userInfo = await User.findOne({ nickname });
		if (userInfo) {
			// nickname이 중복되는 경우
			res.status(400).json({ message: "fail : nickname exist" });
		} else {
			res.status(200).json({ message: "success : valid nickname" });
		}
	}
});

// 패스워드 확인
const checkPassword = asyncWrapper(async (req, res) => {
	const { password } = req.body;
	if (!password) {
		// password가 전달되지 않았을 경우
		res.status(400).json({ message: "fail : require password" });
	} else {
		const userInfo = await findWithPassword({ _id: req.params.id }, password);
		if (!userInfo) {
			// 유효하지 않은 password일 경우
			res.status(400).json({ message: "fail : invalid password" });
		} else {
			res.status(200).json({ message: "success: valid password " });
		}
	}
});

module.exports = {
	sendMail,
	signup,
	login,
	oauthGoogleLogin,
	oauthNaverLogin,
	oauthKakaoLogin,
	logout,
	refreshToken,
	validateToken,
	getUserInfo,
	updateUserInfo,
	deleteUser,
	checkEmail,
	checkNickname,
	checkPassword,
};
