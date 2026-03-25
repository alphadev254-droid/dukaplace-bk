const express = require("express");
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { getMyProducts } = require("../controllers/sellerController");
const { auth, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { apiLimiter, writeLimiter } = require("../middleware/rateLimiter");

router.get("/",            apiLimiter,   getProducts);
router.get("/my-products", apiLimiter,   auth, authorize("seller", "admin"), getMyProducts);
router.get("/:id",         apiLimiter,   getProduct);
router.post("/",           writeLimiter, auth, authorize("seller", "admin"), upload.array("images", 5), createProduct);
router.put("/:id",         writeLimiter, auth, authorize("seller", "admin"), upload.array("images", 5), updateProduct);
router.delete("/:id",      writeLimiter, auth, authorize("seller", "admin"), deleteProduct);

module.exports = router;
