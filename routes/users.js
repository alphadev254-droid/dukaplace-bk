const express = require("express");
const router = express.Router();
const { updateProfile, changePassword } = require("../controllers/userController");
const { auth } = require("../middleware/auth");

router.put("/profile", auth, updateProfile);
router.put("/password", auth, changePassword);

module.exports = router;
