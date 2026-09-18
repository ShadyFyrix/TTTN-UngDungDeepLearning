const authService = require("../services/auth.service");

const signup = async (req, res, next) => {
    try {
        const result = await authService.signup(req.body);
        const message = result.emailSent
            ? "Đăng ký thành công. Vui lòng kiểm tra email để xác thực."
            : "Đăng ký thành công nhưng không thể gửi email xác thực. Vui lòng thử gửi lại.";
        res.status(201).json({
            success: true,
            message,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const resendVerificationEmail = async (req, res, next) => {
    try {
        await authService.resendVerificationEmail(req.body.email);
        res.status(200).json({
            success: true,
            message: "Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.",
        });
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        await authService.verifyEmail(req.body.token);
        res.status(200).json({
            success: true,
            message: "Xác thực email thành công",
            data: { valid: true },
        });
    } catch (error) {
        next(error);
    }
};

const signin = async (req, res, next) => {
    try {
        const result = await authService.signin(req.body);
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        // Normally refresh token can be in body or cookie
        const token = req.body.refreshToken;
        const result = await authService.refreshToken(token);
        res.status(200).json({
            success: true,
            message: "Refresh token thành công",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const signout = async (req, res, next) => {
    try {
        await authService.signout(req.user.sub);
        res.status(200).json({
            success: true,
            message: "Đăng xuất thành công",
        });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email);
        res.status(200).json({
            success: true,
            message: "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.",
        });
    } catch (error) {
        next(error);
    }
};

const verifyForgotPassword = async (req, res, next) => {
    try {
        await authService.verifyForgotPassword(req.body.token);
        res.status(200).json({
            success: true,
            message: "Token hợp lệ",
            data: { valid: true },
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        res.status(200).json({
            success: true,
            message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user.sub);
        res.status(200).json({
            success: true,
            message: "Lấy thông tin người dùng thành công",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    resendVerificationEmail,
    verifyEmail,
    signin,
    refreshToken,
    signout,
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
    getMe,
};
