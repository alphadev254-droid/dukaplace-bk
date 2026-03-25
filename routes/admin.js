const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const { adminLimiter, writeLimiter } = require("../middleware/rateLimiter");
const {
  getStats,
  getAllUsers,
  getAllOrders,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  verifyUser,
  deactivateUser,
  deleteUser,
} = require("../controllers/adminController");

router.get("/stats",                  adminLimiter, auth, adminOnly, getStats);
router.get("/users",                  adminLimiter, auth, adminOnly, getAllUsers);
router.put("/users/:id/verify",       writeLimiter, auth, adminOnly, verifyUser);
router.put("/users/:id/deactivate",   writeLimiter, auth, adminOnly, deactivateUser);
router.delete("/users/:id",           writeLimiter, auth, adminOnly, deleteUser);
router.get("/orders",                 adminLimiter, auth, adminOnly, getAllOrders);
router.get("/categories",             adminLimiter, auth, adminOnly, getCategories);
router.post("/categories",            writeLimiter, auth, adminOnly, createCategory);
router.put("/categories/:id",         writeLimiter, auth, adminOnly, updateCategory);
router.delete("/categories/:id",      writeLimiter, auth, adminOnly, deleteCategory);

module.exports = router;
