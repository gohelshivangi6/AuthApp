const chatService = require("../services/chatService");

async function getChatUsers(req, res, next) {
  try {
    const users = await chatService.getChatUsers(req.user.id);
    res.json({ success: true, users });
  } catch (err) { next(err); }
}

async function createConversation(req, res, next) {
  try {
    const conversation = await chatService.findOrCreateConversation(req.user.id, req.body.participantId);
    res.status(201).json({ success: true, conversation });
  } catch (err) { next(err); }
}

async function getConversations(req, res, next) {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json({ success: true, conversations });
  } catch (err) { next(err); }
}

async function getMessages(req, res, next) {
  try {
    const result = await chatService.getMessages(req.params.id, req.user.id, req.query.page, req.query.limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const message = await chatService.sendMessage(
      req.params.id, req.user.id, req.body.content, req.user.name, req.user.email
    );
    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
}

async function deleteMessage(req, res, next) {
  try {
    const result = await chatService.deleteMessage(
      req.params.id, req.params.msgId, req.user.id, req.body.deleteFrom
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

function getOnlineUsers(req, res) {
  const { getActiveUserIds } = require("../utils/websocket");
  res.json({ success: true, onlineUserIds: getActiveUserIds() });
}

module.exports = {
  getChatUsers,
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  getOnlineUsers,
};
