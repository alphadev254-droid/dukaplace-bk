const express = require("express");
const router = express.Router();
const { signup, login, logout, getMe, forgotPassword, resetPassword } = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");

router.post("/signup",          authLimiter, signup);
router.post("/login",           authLimiter, login);
router.post("/logout",          logout);
router.get("/me",               auth, getMe);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password",  otpLimiter, resetPassword);

module.exports = router;
