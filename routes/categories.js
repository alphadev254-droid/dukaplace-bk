const express = require("express");
const router = express.Router();
const { getCategories, createCategory } = require("../controllers/categoryController");
const { auth, authorize } = require("../middleware/auth");

router.get("/", getCategories);
router.post("/", auth, authorize("admin"), createCategory);

module.exports = router;
