const prisma = require("../lib/prisma");
const { queueEmail } = require("../utils/emailService");
const {
  ok, created, fail, notFound, serverError,
  hashPassword, comparePassword,
  signToken, setAuthCookie, clearAuthCookie,
  generateOtp, otpExpiry,
} = require("../utils");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role, location } = req.body;
    if (!name || !email || !password)
      return fail(res, "Name, email and password are required");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail(res, "Email already registered");

    const user = await prisma.user.create({
      data: {
        name, email,
        password: await hashPassword(password),
        phone:    phone    || null,
        role:     role     || "buyer",
        location: location || null,
        isVerified: true,
        isActive:   true,
      },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, location: true, isVerified: true, isActive: true, createdAt: true,
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);

    queueEmail({
      to: email, toName: name, template: "welcome",
      templateData: { name, email, role: user.role, loginUrl: `${process.env.APP_URL}/auth` },
    }).catch((e) => console.error("Welcome email error:", e.message));

    return created(res, { user, token }, "User registered successfully");
  } catch (e) { return serverError(res, e, "signup"); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, "Email and password are required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: "Account is deactivated" });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);

    const { password: _, ...safeUser } = user;
    return ok(res, { user: safeUser, token }, "Login successful");
  } catch (e) { return serverError(res, e, "login"); }
};

exports.logout = (_req, res) => {
  clearAuthCookie(res);
  return ok(res, null, "Logged out successfully");
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return fail(res, "Email is required");

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return same message to avoid email enumeration
    if (!user) return ok(res, null, "If that email exists, a reset code has been sent");

    const otp     = generateOtp();
    const expires = otpExpiry(10);

    await prisma.user.update({
      where: { email },
      data:  { passwordResetToken: otp, passwordResetExpires: expires },
    });

    queueEmail({
      to: email, toName: user.name, template: "otp",
      templateData: { name: user.name, otp, expiresInMinutes: 10 },
    }).catch((e) => console.error("OTP email error:", e.message));

    return ok(res, null, "A 6-digit reset code has been sent to your email");
  } catch (e) { return serverError(res, e, "forgotPassword"); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return fail(res, "Token and new password are required");
    if (password.length < 6)  return fail(res, "Password must be at least 6 characters");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken:   token,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) return fail(res, "Invalid or expired reset code");

    await prisma.user.update({
      where: { id: user.id },
      data:  {
        password:            await hashPassword(password),
        passwordResetToken:   null,
        passwordResetExpires: null,
      },
    });

    queueEmail({
      to: user.email, toName: user.name, template: "passwordChanged",
      templateData: {
        name: user.name,
        changedAt:    new Date().toLocaleString(),
        supportEmail: process.env.SMTP_USER,
      },
    }).catch((e) => console.error("PasswordChanged email error:", e.message));

    return ok(res, null, "Password reset successful. You can now log in.");
  } catch (e) { return serverError(res, e, "resetPassword"); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        role: true, location: true, isVerified: true, isActive: true, createdAt: true,
      },
    });
    if (!user) return notFound(res, "User not found");
    return ok(res, user);
  } catch (e) { return serverError(res, e, "getMe"); }
};
