const express = require("express");
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require("../controllers/messageController");
const { auth } = require("../middleware/auth");

router.get("/conversations", auth, getConversations);
router.get("/conversations/:conversationId", auth, getMessages);
router.post("/", auth, sendMessage);

module.exports = router;
