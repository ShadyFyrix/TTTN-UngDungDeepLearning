const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { generateRandomToken, generateOTP, hashToken } = require("../utils/otp");
const { sendVerificationEmail, sendPasswordResetEmail } = require("./email.service");

const signup = async ({ full_name, email, password }) => {
    email = email.toLowerCase().trim();

    // Check if email already exists
    const [existingUsers] = await db.execute("SELECT id FROM administrators WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
        throw new Error("Email đã được đăng ký");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = generateRandomToken(32);
    
    const expiresInMinutes = Number(process.env.EMAIL_VERIFY_EXPIRES_MINUTES) || 15;
    const expiresDate = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Insert new user (administrator)
    const [result] = await db.execute(
        `INSERT INTO administrators 
         (full_name, email, password, role, is_email_verified, email_verify_token, email_verify_expires) 
         VALUES (?, ?, ?, 'admin', 0, ?, ?)`,
        [full_name, email, passwordHash, hashToken(verifyToken), expiresDate]
    );

    const newUserId = result.insertId;

    // Send verification email - track success/failure
    let emailSent = false;
    try {
        await sendVerificationEmail(email, full_name, verifyToken);
        emailSent = true;
    } catch (error) {
        console.error("Lỗi khi gửi email xác thực:", error.message);
        console.error("Chi tiết lỗi:", error);
    }

    return {
        id: newUserId,
        full_name,
        email,
        emailSent,
    };
};

const resendVerificationEmail = async (email) => {
    email = email.toLowerCase().trim();

    const [users] = await db.execute(
        "SELECT id, full_name, is_email_verified FROM administrators WHERE email = ?",
        [email]
    );

    if (users.length === 0) {
        throw new Error("Email không tồn tại trong hệ thống");
    }

    const user = users[0];

    if (user.is_email_verified) {
        throw new Error("Email đã được xác thực. Bạn có thể đăng nhập.");
    }

    // Generate new token
    const verifyToken = generateRandomToken(32);
    const expiresInMinutes = Number(process.env.EMAIL_VERIFY_EXPIRES_MINUTES) || 15;
    const expiresDate = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.execute(
        "UPDATE administrators SET email_verify_token = ?, email_verify_expires = ? WHERE id = ?",
        [hashToken(verifyToken), expiresDate, user.id]
    );

    await sendVerificationEmail(email, user.full_name, verifyToken);

    return true;
};

const verifyEmail = async (token) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id FROM administrators WHERE email_verify_token = ? AND email_verify_expires > NOW()",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token xác thực không hợp lệ hoặc đã hết hạn");
    }

    const userId = users[0].id;

    // Update verified status
    await db.execute(
        `UPDATE administrators 
         SET is_email_verified = 1, email_verify_token = NULL, email_verify_expires = NULL 
         WHERE id = ?`,
        [userId]
    );

    return true;
};

const signin = async ({ email, password }) => {
    email = email.toLowerCase().trim();

    const [users] = await db.execute(
        "SELECT * FROM administrators WHERE email = ?",
        [email]
    );

    if (users.length === 0) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    const user = users[0];

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    if (!user.is_email_verified) {
        throw new Error("Vui lòng xác thực email trước khi đăng nhập");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await db.execute(
        "UPDATE administrators SET refresh_token_hash = ?, last_login_at = NOW() WHERE id = ?",
        [refreshTokenHash, user.id]
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        },
    };
};

const refreshToken = async (token) => {
    if (!token) {
        throw new Error("Refresh token không tồn tại");
    }

    let payload;
    try {
        payload = verifyRefreshToken(token);
    } catch {
        throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    if (payload.type !== "refresh") {
        throw new Error("Token không hợp lệ");
    }

    const [users] = await db.execute(
        "SELECT id, full_name, email, role, refresh_token_hash FROM administrators WHERE id = ?",
        [payload.sub]
    );

    if (users.length === 0) {
        throw new Error("Người dùng không tồn tại");
    }

    const user = users[0];

    if (!user.refresh_token_hash) {
        throw new Error("Refresh token không hợp lệ");
    }

    const matched = await bcrypt.compare(token, user.refresh_token_hash);
    if (!matched) {
        throw new Error("Refresh token không hợp lệ");
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await db.execute(
        "UPDATE administrators SET refresh_token_hash = ? WHERE id = ?",
        [newRefreshTokenHash, user.id]
    );

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

const signout = async (userId) => {
    await db.execute(
        "UPDATE administrators SET refresh_token_hash = NULL WHERE id = ?",
        [userId]
    );
    return true;
};

const forgotPassword = async (email) => {
    email = email.toLowerCase().trim();

    const [users] = await db.execute("SELECT id, full_name FROM administrators WHERE email = ?", [email]);
    if (users.length === 0) {
        // Return true anyway to prevent email enumeration
        return true;
    }

    const user = users[0];
    const resetToken = generateOTP();
    
    const expiresInMinutes = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES) || 15;
    const expiresDate = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.execute(
        "UPDATE administrators SET password_reset_token_hash = ?, password_reset_expires = ? WHERE id = ?",
        [hashToken(resetToken), expiresDate, user.id]
    );

    try {
        await sendPasswordResetEmail(email, user.full_name, resetToken);
    } catch (error) {
        console.error("Lỗi khi gửi email reset password:", error.message);
    }

    return true;
};

const verifyForgotPassword = async (token) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id FROM administrators WHERE password_reset_token_hash = ? AND password_reset_expires > NOW()",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }

    return true;
};

const resetPassword = async (token, newPassword) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id FROM administrators WHERE password_reset_token_hash = ? AND password_reset_expires > NOW()",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }

    const userId = users[0].id;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.execute(
        `UPDATE administrators 
         SET password = ?, password_reset_token_hash = NULL, password_reset_expires = NULL, refresh_token_hash = NULL 
         WHERE id = ?`,
        [passwordHash, userId]
    );

    return true;
};

const getMe = async (userId) => {
    const [users] = await db.execute(
        "SELECT id, email, username, full_name, role, is_email_verified, last_login_at, created_at FROM administrators WHERE id = ?",
        [userId]
    );

    if (users.length === 0) {
        throw new Error("Người dùng không tồn tại");
    }

    return users[0];
};

module.exports = {
    signup,
    verifyEmail,
    resendVerificationEmail,
    signin,
    refreshToken,
    signout,
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
    getMe,
};
