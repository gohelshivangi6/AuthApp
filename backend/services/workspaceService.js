const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../utils/dbHelper");
const { emitWorkspaceMessage, emitBulkPermissionUpdate, joinUserWorkspaceRooms, removeUserFromWorkspaceRoom } = require("../utils/websocket");
const { getUserById } = require("./userService");

async function getWorkspaces(userId, userRole) {
  const db = await readDB();
  const workspaces = db.workspaces || [];
  const members = db.workspaceMembers || [];

  if (userRole !== "admin") {
    const myWorkspaceIds = new Set(
      members.filter((m) => m.userId === userId).map((m) => m.workspaceId)
    );
    return workspaces.filter((w) => myWorkspaceIds.has(w.id));
  }

  return workspaces;
}

async function createWorkspace(name, description, userId) {
  if (!name || !name.trim()) {
    const err = new Error("Workspace name is required.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();

  const workspace = {
    id: uuidv4(),
    name: name.trim(),
    description: description || "",
    createdBy: userId,
    createdAt: new Date().toISOString(),
    archived: false,
  };

  if (!db.workspaces) db.workspaces = [];
  db.workspaces.push(workspace);

  if (!db.workspaceMembers) db.workspaceMembers = [];
  db.workspaceMembers.push({
    id: uuidv4(),
    workspaceId: workspace.id,
    userId,
    joinedAt: new Date().toISOString(),
  });

  await writeDB(db);
  return workspace;
}

async function updateWorkspace(id, name, description) {
  const db = await readDB();

  const workspace = (db.workspaces || []).find((w) => w.id === id);
  if (!workspace) {
    const err = new Error("Workspace not found.");
    err.status = 404;
    throw err;
  }

  if (name !== undefined) workspace.name = name.trim();
  if (description !== undefined) workspace.description = description;

  await writeDB(db);
  return workspace;
}

async function deleteWorkspace(id) {
  const db = await readDB();

  const idx = (db.workspaces || []).findIndex((w) => w.id === id);
  if (idx === -1) {
    const err = new Error("Workspace not found.");
    err.status = 404;
    throw err;
  }

  db.workspaces.splice(idx, 1);
  db.workspaceMembers = (db.workspaceMembers || []).filter((m) => m.workspaceId !== id);
  db.workspaceMessages = (db.workspaceMessages || []).filter((m) => m.workspaceId !== id);

  await writeDB(db);

  try { emitBulkPermissionUpdate([], { type: "workspace", action: "deleted", workspaceId: id }); } catch (_) {}
}

async function getMembers(id, userId, userRole) {
  const db = await readDB();

  const workspace = (db.workspaces || []).find((w) => w.id === id);
  if (!workspace) {
    const err = new Error("Workspace not found.");
    err.status = 404;
    throw err;
  }

  const isMember = (db.workspaceMembers || []).some(
    (m) => m.workspaceId === id && m.userId === userId
  );
  if (userRole !== "admin" && !isMember) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  return (db.workspaceMembers || [])
    .filter((m) => m.workspaceId === id)
    .map((m) => {
      const user = getUserById(db, m.userId);
      return {
        id: m.id,
        userId: m.userId,
        name: user?.name || "Unknown",
        email: user?.email || "",
        joinedAt: m.joinedAt,
      };
    });
}

async function addMember(id, userIdToAdd) {
  if (!userIdToAdd) {
    const err = new Error("userId is required.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();

  const workspace = (db.workspaces || []).find((w) => w.id === id);
  if (!workspace) {
    const err = new Error("Workspace not found.");
    err.status = 404;
    throw err;
  }

  const user = getUserById(db, userIdToAdd);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const alreadyMember = (db.workspaceMembers || []).some(
    (m) => m.workspaceId === id && m.userId === userIdToAdd
  );
  if (alreadyMember) {
    const err = new Error("User is already a member.");
    err.status = 400;
    throw err;
  }

  if (!db.workspaceMembers) db.workspaceMembers = [];
  const member = {
    id: uuidv4(),
    workspaceId: id,
    userId: userIdToAdd,
    joinedAt: new Date().toISOString(),
  };
  db.workspaceMembers.push(member);

  await writeDB(db);

  const enriched = { ...member, name: user.name, email: user.email };
  try { emitWorkspaceMessage(id, { type: "member-added", userId: userIdToAdd }); } catch (_) {}
  try { await joinUserWorkspaceRooms(userIdToAdd); } catch (_) {}

  return enriched;
}

async function removeMember(id, userIdToRemove, requester) {
  const db = await readDB();

  const idx = (db.workspaceMembers || []).findIndex(
    (m) => m.workspaceId === id && m.userId === userIdToRemove
  );
  if (idx === -1) {
    const err = new Error("Member not found.");
    err.status = 404;
    throw err;
  }

  db.workspaceMembers.splice(idx, 1);

  const user = getUserById(db, userIdToRemove);
  if (!db.workspaceMessages) db.workspaceMessages = [];
  db.workspaceMessages.push({
    id: uuidv4(),
    workspaceId: id,
    userId: userIdToRemove,
    content: "was removed from the workspace",
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
    type: "system",
  });
  if (db.workspaceMessages.length > 5000) {
    db.workspaceMessages = db.workspaceMessages.slice(-5000);
  }

  await writeDB(db);

  const systemMsg = db.workspaceMessages[db.workspaceMessages.length - 1];
  const enrichedMsg = { ...systemMsg, userName: user?.name || "Unknown", userEmail: user?.email || "" };
  try { emitWorkspaceMessage(id, { type: "new", message: enrichedMsg }); } catch (_) {}
  try { emitWorkspaceMessage(id, { type: "member-removed", userId: userIdToRemove }); } catch (_) {}
  try { await removeUserFromWorkspaceRoom(userIdToRemove, id); } catch (_) {}

  return { message: "Member removed." };
}

async function leaveWorkspace(id, userId, userName) {
  const db = await readDB();

  const idx = (db.workspaceMembers || []).findIndex(
    (m) => m.workspaceId === id && m.userId === userId
  );
  if (idx === -1) {
    const err = new Error("You are not a member of this workspace.");
    err.status = 404;
    throw err;
  }

  db.workspaceMembers.splice(idx, 1);

  if (!db.workspaceMessages) db.workspaceMessages = [];
  db.workspaceMessages.push({
    id: uuidv4(),
    workspaceId: id,
    userId,
    content: "left the workspace",
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
    type: "system",
  });
  if (db.workspaceMessages.length > 5000) {
    db.workspaceMessages = db.workspaceMessages.slice(-5000);
  }

  await writeDB(db);

  const systemMsg = db.workspaceMessages[db.workspaceMessages.length - 1];
  const enrichedMsg = { ...systemMsg, userName, userEmail: "" };
  try { emitWorkspaceMessage(id, { type: "new", message: enrichedMsg }); } catch (_) {}
  try { emitWorkspaceMessage(id, { type: "member-removed", userId }); } catch (_) {}
  try { await removeUserFromWorkspaceRoom(userId, id); } catch (_) {}

  return { message: "You left the workspace." };
}

async function getMessages(id, userId, userRole, page = 1, limit = 50) {
  const db = await readDB();

  const isMember = (db.workspaceMembers || []).some(
    (m) => m.workspaceId === id && m.userId === userId
  );
  if (userRole !== "admin" && !isMember) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  let messages = (db.workspaceMessages || [])
    .filter((m) => m.workspaceId === id && !(m.deletedFor || []).includes(userId) && !m.deletedAt)
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

async function sendMessage(id, userId, userRole, content, userName, userEmail) {
  if (!content || !content.trim()) {
    const err = new Error("Message content is required.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();

  const isMember = (db.workspaceMembers || []).some(
    (m) => m.workspaceId === id && m.userId === userId
  );
  if (userRole !== "admin" && !isMember) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  if (!db.workspaceMessages) db.workspaceMessages = [];
  const message = {
    id: uuidv4(),
    workspaceId: id,
    userId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
  };
  db.workspaceMessages.push(message);

  if (db.workspaceMessages.length > 5000) {
    db.workspaceMessages = db.workspaceMessages.slice(-5000);
  }

  await writeDB(db);

  const enriched = { ...message, userName, userEmail };
  try { emitWorkspaceMessage(id, { type: "new", message: enriched }); } catch (_) {}

  return enriched;
}

async function editMessage(id, msgId, userId, content) {
  if (!content || !content.trim()) {
    const err = new Error("Message content is required.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();
  const message = (db.workspaceMessages || []).find(
    (m) => m.id === msgId && m.workspaceId === id
  );
  if (!message) {
    const err = new Error("Message not found.");
    err.status = 404;
    throw err;
  }

  if (message.userId !== userId) {
    const err = new Error("You can only edit your own messages.");
    err.status = 403;
    throw err;
  }

  message.content = content.trim();
  message.editedAt = new Date().toISOString();

  await writeDB(db);

  try { emitWorkspaceMessage(id, { type: "edited", message }); } catch (_) {}

  return message;
}

async function deleteMessage(id, msgId, userId, userRole, deleteFrom) {
  const db = await readDB();

  const message = (db.workspaceMessages || []).find(
    (m) => m.id === msgId && m.workspaceId === id
  );
  if (!message) {
    const err = new Error("Message not found.");
    err.status = 404;
    throw err;
  }

  if (message.userId !== userId && userRole !== "admin") {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  if (message.userId === userId && deleteFrom === "me") {
    if (!message.deletedFor) message.deletedFor = [];
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
    }
    await writeDB(db);
    return { message: "Message deleted from your view." };
  }

  message.deletedAt = new Date().toISOString();
  await writeDB(db);

  try { emitWorkspaceMessage(id, { type: "deleted", messageId: msgId, workspaceId: id }); } catch (_) {}

  return { message: "Message deleted." };
}

module.exports = {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getMembers,
  addMember,
  removeMember,
  leaveWorkspace,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
};
