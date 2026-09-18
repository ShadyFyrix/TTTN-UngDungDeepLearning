const { verifyAccessToken } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy token xác thực hoặc token không hợp lệ",
            });
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyAccessToken(token);

        if (payload.type !== "access") {
            return res.status(401).json({
                success: false,
                message: "Access token không hợp lệ",
            });
        }

        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Access token không hợp lệ hoặc đã hết hạn",
        });
    }
};

module.exports = authMiddleware;
