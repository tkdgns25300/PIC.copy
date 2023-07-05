const jwt = require("jsonwebtoken");

const verifyToken = (token, type) => {
	try {
		if (type === "accessToken") {
			const data = jwt.verify(token, process.env.JWT_ACCESS_KEY);
			return data;
		} else if (type === "refreshToken") {
			const data = jwt.verify(token, process.env.JWT_REFRESH_KEY);
			return data;
		}
	} catch (error) {
		return "fail";
	}
};

module.exports = verifyToken;
