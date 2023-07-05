const jwt = require("jsonwebtoken");

const generateToken = (userInfo, type) => {
	if (type === "accessToken") {
		return jwt.sign(
			{
				id: userInfo._id,
			},
			process.env.JWT_ACCESS_KEY,
			{ expiresIn: "3h" }
		);
	} else if (type === "refreshToken") {
		return jwt.sign(
			{
				id: userInfo._id,
			},
			process.env.JWT_REFRESH_KEY,
			{ expiresIn: "7d" }
		);
	}
};

module.exports = generateToken;
