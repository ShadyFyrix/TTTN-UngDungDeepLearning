const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin quyền hạn của người dùng",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập chức năng này",
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
