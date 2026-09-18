const errorMiddleware = (err, req, res, next) => {
    console.error("Lỗi hệ thống:", err);
    res.status(400).json({
        success: false,
        message: err.message || "Có lỗi xảy ra",
    });
};

module.exports = errorMiddleware;
