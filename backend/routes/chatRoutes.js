const express = require("express");
const router = express.Router();
const { requireAuth } = require("../controllers/authController");
const ctrl = require("../controllers/chatController");

router.use(requireAuth);

router.get("/users", ctrl.getChatUsers);
router.post("/conversations", ctrl.createConversation);
router.get("/conversations", ctrl.getConversations);
router.get("/conversations/:id/messages", ctrl.getMessages);
router.post("/conversations/:id/messages", ctrl.sendMessage);

module.exports = router;
