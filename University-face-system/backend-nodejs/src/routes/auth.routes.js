const express = require("express");
const controller = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/signup", controller.signup);
router.post("/resend-verification-email", controller.resendVerificationEmail);
router.post("/verify-email", controller.verifyEmail);
router.post("/signin", controller.signin);
router.post("/refresh-token", controller.refreshToken);
router.post("/forgot-password", controller.forgotPassword);
router.post("/verify-forgot-password", controller.verifyForgotPassword);
router.post("/reset-password", controller.resetPassword);

// Require auth
router.get("/me", authMiddleware, controller.getMe);
router.post("/signout", authMiddleware, controller.signout);

module.exports = router;
