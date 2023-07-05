const verifyToken = require("../utils/verifyToken");

const checkToken = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            res.status(401).json({ message: "fail : require token" });
        } else {
            const accessToken = req.headers.authorization;
            const data = verifyToken(accessToken, "accessToken");
            if (data === "fail") {
             	// 유효하지 않은 token일 경우
				res.status(401).json({ message: "fail : invalid token" });
			} else {
				next();
			}
        }
    } catch (error) {
        next(error);
    }
};

module.exports = checkToken;