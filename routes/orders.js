const express = require("express");
const router = express.Router();
const { createOrder, getBuyerOrders, getSellerOrders, updateOrderStatus } = require("../controllers/orderController");
const { auth } = require("../middleware/auth");
const { apiLimiter, writeLimiter } = require("../middleware/rateLimiter");

router.post("/",                 writeLimiter, auth, createOrder);
router.get("/buyer",             apiLimiter,   auth, getBuyerOrders);
router.get("/seller",            apiLimiter,   auth, getSellerOrders);
router.put("/:orderId/status",   writeLimiter, auth, updateOrderStatus);

module.exports = router;
