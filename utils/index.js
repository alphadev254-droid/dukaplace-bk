const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const crypto    = require("crypto");

// ─── Response helpers ─────────────────────────────────────────────────────────

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const created = (res, data, message = "Created") =>
  ok(res, data, message, 201);

const fail = (res, message = "Bad request", status = 400) =>
  res.status(status).json({ success: false, message });

const notFound = (res, message = "Not found") =>
  fail(res, message, 404);

const forbidden = (res, message = "Access forbidden") =>
  fail(res, message, 403);

const serverError = (res, error, label = "Error") => {
  console.error(`[${label}]`, error);
  return res.status(500).json({ success: false, message: "Server error" });
};

// ─── Pagination ───────────────────────────────────────────────────────────────

/**
 * Parse page/pageSize from query, return { skip, take, page, pageSize }
 */
const parsePagination = (query, defaultPageSize = 12, maxPageSize = 100) => {
  const page     = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(query.pageSize, 10) || defaultPageSize));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
};

/**
 * Wrap paginated results in standard envelope
 */
const paginated = (res, data, total, page, pageSize) =>
  res.json({
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });

// ─── Slug ─────────────────────────────────────────────────────────────────────

const slugify = (text) =>
  text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// ─── Password ─────────────────────────────────────────────────────────────────

const hashPassword   = (plain)         => bcrypt.hash(plain, 10);
const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);

// ─── JWT ──────────────────────────────────────────────────────────────────────

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

// ─── Cookie ───────────────────────────────────────────────────────────────────

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

const setAuthCookie = (res, token) =>
  res.cookie("token", token, {
    ...COOKIE_OPTS,
    secure: process.env.NODE_ENV === "production",
  });

const clearAuthCookie = (res) =>
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

// ─── OTP ──────────────────────────────────────────────────────────────────────

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const otpExpiry = (minutes = 10) => new Date(Date.now() + minutes * 60 * 1000);

// ─── Misc ─────────────────────────────────────────────────────────────────────

/** Strip undefined keys from an object (useful for Prisma update payloads) */
const compact = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

module.exports = {
  // responses
  ok, created, fail, notFound, forbidden, serverError,
  // pagination
  parsePagination, paginated,
  // slug
  slugify,
  // password
  hashPassword, comparePassword,
  // jwt
  signToken, verifyToken,
  // cookie
  setAuthCookie, clearAuthCookie,
  // otp
  generateOtp, otpExpiry,
  // misc
  compact,
};
