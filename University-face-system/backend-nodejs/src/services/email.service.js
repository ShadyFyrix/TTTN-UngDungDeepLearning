const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const sendVerificationEmail = async (email, name, token) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Xác thực tài khoản",
        html: `
            <h2>Xin chào ${name},</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản.</p>
            <p>Vui lòng click vào link bên dưới để xác thực email:</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Xác thực email</a>
            <p>Link có hiệu lực trong ${process.env.EMAIL_VERIFY_EXPIRES_MINUTES || 15} phút.</p>
        `,
    });
};

const sendPasswordResetEmail = async (email, name, otpCode) => {
    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Mã xác nhận đặt lại mật khẩu: ${otpCode}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
                <div style="background: linear-gradient(135deg, #175b9f 0%, #1a73c7 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 700;">🔐 Đặt lại mật khẩu</h1>
                    <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">Hệ thống Điểm danh Khuôn mặt</p>
                </div>
                <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #334155; font-size: 15px; margin: 0 0 8px 0;">Xin chào <strong>${name}</strong>,</p>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                        Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác nhận bên dưới:
                    </p>
                    <div style="background: #f8fafc; border: 2px dashed #175b9f; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                        <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0; font-weight: 600;">Mã xác nhận của bạn</p>
                        <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #175b9f; font-family: 'Courier New', monospace;">${otpCode}</div>
                    </div>
                    <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
                        <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">
                            ⏱️ Mã có hiệu lực trong <strong>${process.env.RESET_PASSWORD_EXPIRES_MINUTES || 15} phút</strong>. Không chia sẻ mã này với bất kỳ ai.
                        </p>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                    </p>
                </div>
                <div style="background: #f1f5f9; padding: 16px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 Hệ thống Điểm danh Khuôn mặt - NTU</p>
                </div>
            </div>
        `,
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
};
