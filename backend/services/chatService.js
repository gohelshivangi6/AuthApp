const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../utils/dbHelper");
const { getUserById } = require("./userService");
const { emitDirectMessage } = require("../utils/websocket");

async function getChatUsers(currentUserId) {
  const db = await readDB();
  return (db.users || [])
    .filter((u) => u.id !== currentUserId && u.status === "VERIFIED")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }));
}

async function findOrCreateConversation(currentUserId, participantId) {
  if (!participantId) {
    const err = new Error("participantId is required.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();

  const participant = getUserById(db, participantId);
  if (!participant) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  if (participant.id === currentUserId) {
    const err = new Error("Cannot create conversation with yourself.");
    err.status = 400;
    throw err;
  }

  const existing = (db.directConversations || []).find((c) =>
    c.participants.includes(currentUserId) &&
    c.participants.includes(participantId)
  );
  if (existing) {
    const otherUser = getUserById(db, participantId);
    const lastMessage = (db.directMessages || [])
      .filter((m) => m.conversationId === existing.id && !m.deletedAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    return {
      ...existing,
      otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, email: otherUser.email } : null,
      lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, userId: lastMessage.userId } : null,
    };
  }

  if (!db.directConversations) db.directConversations = [];
  const conversation = {
    id: uuidv4(),
    participants: [currentUserId, participantId],
    createdAt: new Date().toISOString(),
  };
  db.directConversations.push(conversation);
  await writeDB(db);

  const otherUser = getUserById(db, participantId);
  return {
    ...conversation,
    otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, email: otherUser.email } : null,
    lastMessage: null,
  };
}

async function getConversations(currentUserId) {
  const db = await readDB();
  const conversations = (db.directConversations || [])
    .filter((c) => c.participants.includes(currentUserId));

  const enriched = conversations.map((c) => {
    const otherUserId = c.participants.find((p) => p !== currentUserId);
    const otherUser = getUserById(db, otherUserId);
    const lastMessage = (db.directMessages || [])
      .filter((m) => m.conversationId === c.id && !m.deletedAt && !(m.deletedFor || []).includes(currentUserId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

    return {
      ...c,
      otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, email: otherUser.email } : null,
      lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, userId: lastMessage.userId } : null,
    };
  });

  enriched.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  return enriched;
}

async function getMessages(conversationId, currentUserId, page = 1, limit = 50) {
  const db = await readDB();

  const conversation = (db.directConversations || []).find((c) => c.id === conversationId);
  if (!conversation) {
    const err = new Error("Conversation not found.");
    err.status = 404;
    throw err;
  }

  if (!conversation.participants.includes(currentUserId)) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  let messages = (db.directMessages || [])
    .filter((m) => m.conversationId === conversationId && !(m.deletedFor || []).includes(currentUserId) && !m.deletedAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = messages.length;
  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);
  const paged = messages.slice((p - 1) * l, p * l).reverse();

  const enriched = paged.map((msg) => {
    const user = getUserById(db, msg.userId);
    return {
      ...msg,
      userName: user?.name || "Unknown",
      userEmail: user?.email || "",
    };
  });

  return { messages: enriched, total, page: p, limit: l };
}

async function sendMessage(conversationId, currentUserId, content, userName, userEmail) {
  if (!content || !content.trim()) {
    const err = new Error("Message content is required.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();

  const conversation = (db.directConversations || []).find((c) => c.id === conversationId);
  if (!conversation) {
    const err = new Error("Conversation not found.");
    err.status = 404;
    throw err;
  }

  if (!conversation.participants.includes(currentUserId)) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  if (!db.directMessages) db.directMessages = [];
  const message = {
    id: uuidv4(),
    conversationId,
    userId: currentUserId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
  };
  db.directMessages.push(message);

  if (db.directMessages.length > 5000) {
    db.directMessages = db.directMessages.slice(-5000);
  }

  await writeDB(db);

  const enriched = { ...message, userName, userEmail };
  try { emitDirectMessage(conversationId, { type: "new", message: enriched }); } catch (_) {}

  return enriched;
}

async function deleteMessage(conversationId, msgId, currentUserId, deleteFrom) {
  const db = await readDB();

  const conversation = (db.directConversations || []).find((c) => c.id === conversationId);
  if (!conversation) {
    const err = new Error("Conversation not found.");
    err.status = 404;
    throw err;
  }

  const message = (db.directMessages || []).find(
    (m) => m.id === msgId && m.conversationId === conversationId
  );
  if (!message) {
    const err = new Error("Message not found.");
    err.status = 404;
    throw err;
  }

  if (!conversation.participants.includes(currentUserId)) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  if (deleteFrom === "me") {
    if (!message.deletedFor) message.deletedFor = [];
    if (!message.deletedFor.includes(currentUserId)) {
      message.deletedFor.push(currentUserId);
    }
    await writeDB(db);
    return { message: "Message deleted from your view." };
  }

  message.deletedAt = new Date().toISOString();
  await writeDB(db);

  try { emitDirectMessage(conversationId, { type: "deleted", messageId: msgId, conversationId }); } catch (_) {}

  return { message: "Message deleted." };
}

module.exports = {
  getChatUsers,
  findOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
};
