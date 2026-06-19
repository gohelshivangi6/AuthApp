const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../utils/dbHelper");
const { emitWorkspaceMessage, emitBulkPermissionUpdate, joinUserWorkspaceRooms, removeUserFromWorkspaceRoom } = require("../utils/websocket");

// ─── Workspaces ───────────────────────────────────────────

async function getWorkspaces(req, res, next) {
  try {
    const db = await readDB();
    const workspaces = db.workspaces || [];
    const members = db.workspaceMembers || [];

    if (req.user.role !== "admin") {
      const myWorkspaceIds = new Set(
        members.filter((m) => m.userId === req.user.id).map((m) => m.workspaceId)
      );
      return res.json({
        success: true,
        workspaces: workspaces.filter((w) => myWorkspaceIds.has(w.id)),
      });
    }

    res.json({ success: true, workspaces });
  } catch (err) { next(err); }
}

async function createWorkspace(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Workspace name is required." });
    }

    const db = await readDB();
    const workspace = {
      id: uuidv4(),
      name: name.trim(),
      description: description || "",
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      archived: false,
    };

    if (!db.workspaces) db.workspaces = [];
    db.workspaces.push(workspace);

    if (!db.workspaceMembers) db.workspaceMembers = [];
    db.workspaceMembers.push({
      id: uuidv4(),
      workspaceId: workspace.id,
      userId: req.user.id,
      joinedAt: new Date().toISOString(),
    });

    await writeDB(db);
    res.status(201).json({ success: true, workspace });
  } catch (err) { next(err); }
}

async function updateWorkspace(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const db = await readDB();

    const workspace = (db.workspaces || []).find((w) => w.id === id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found." });
    }

    if (name !== undefined) workspace.name = name.trim();
    if (description !== undefined) workspace.description = description;

    await writeDB(db);
    res.json({ success: true, workspace });
  } catch (err) { next(err); }
}

async function deleteWorkspace(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const idx = (db.workspaces || []).findIndex((w) => w.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Workspace not found." });
    }

    db.workspaces.splice(idx, 1);
    db.workspaceMembers = (db.workspaceMembers || []).filter((m) => m.workspaceId !== id);
    db.workspaceMessages = (db.workspaceMessages || []).filter((m) => m.workspaceId !== id);

    await writeDB(db);

    try { emitBulkPermissionUpdate([], { type: "workspace", action: "deleted", workspaceId: id }); } catch (_) {}

    res.json({ success: true, message: "Workspace deleted." });
  } catch (err) { next(err); }
}

// ─── Members ──────────────────────────────────────────────

async function getMembers(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const workspace = (db.workspaces || []).find((w) => w.id === id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found." });
    }

    const isMember = (db.workspaceMembers || []).some(
      (m) => m.workspaceId === id && m.userId === req.user.id
    );
    if (req.user.role !== "admin" && !isMember) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const members = (db.workspaceMembers || [])
      .filter((m) => m.workspaceId === id)
      .map((m) => {
        const user = db.users.find((u) => u.id === m.userId);
        return {
          id: m.id,
          userId: m.userId,
          name: user?.name || "Unknown",
          email: user?.email || "",
          joinedAt: m.joinedAt,
        };
      });

    res.json({ success: true, members });
  } catch (err) { next(err); }
}

async function addMember(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const db = await readDB();

    const workspace = (db.workspaces || []).find((w) => w.id === id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found." });
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const alreadyMember = (db.workspaceMembers || []).some(
      (m) => m.workspaceId === id && m.userId === userId
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: "User is already a member." });
    }

    if (!db.workspaceMembers) db.workspaceMembers = [];
    const member = {
      id: uuidv4(),
      workspaceId: id,
      userId,
      joinedAt: new Date().toISOString(),
    };
    db.workspaceMembers.push(member);

    await writeDB(db);

    const enriched = { ...member, name: user.name, email: user.email };
    try { emitWorkspaceMessage(id, { type: "member-added", userId }); } catch (_) {}
    try { await joinUserWorkspaceRooms(userId); } catch (_) {}

    res.status(201).json({ success: true, member: enriched });
  } catch (err) { next(err); }
}

async function removeMember(req, res, next) {
  try {
    const { id, userId } = req.params;
    const db = await readDB();

    const idx = (db.workspaceMembers || []).findIndex(
      (m) => m.workspaceId === id && m.userId === userId
    );
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }

    db.workspaceMembers.splice(idx, 1);
    await writeDB(db);

    try { emitWorkspaceMessage(id, { type: "member-removed", userId }); } catch (_) {}
    try { await removeUserFromWorkspaceRoom(userId, id); } catch (_) {}

    res.json({ success: true, message: "Member removed." });
  } catch (err) { next(err); }
}

// ─── Messages ─────────────────────────────────────────────

async function getMessages(req, res, next) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const db = await readDB();

    const isMember = (db.workspaceMembers || []).some(
      (m) => m.workspaceId === id && m.userId === req.user.id
    );
    if (req.user.role !== "admin" && !isMember) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    let messages = (db.workspaceMessages || [])
      .filter((m) => m.workspaceId === id && !(m.deletedFor || []).includes(req.user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = messages.length;
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    const paged = messages.slice((p - 1) * l, p * l).reverse();

    const enriched = paged.map((msg) => {
      const user = db.users.find((u) => u.id === msg.userId);
      return {
        ...msg,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "",
      };
    });

    res.json({ success: true, messages: enriched, total, page: p, limit: l });
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    const db = await readDB();

    const isMember = (db.workspaceMembers || []).some(
      (m) => m.workspaceId === id && m.userId === req.user.id
    );
    if (req.user.role !== "admin" && !isMember) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (!db.workspaceMessages) db.workspaceMessages = [];
    const message = {
      id: uuidv4(),
      workspaceId: id,
      userId: req.user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
    };
    db.workspaceMessages.push(message);

    // Cap at 5000 messages
    if (db.workspaceMessages.length > 5000) {
      db.workspaceMessages = db.workspaceMessages.slice(-5000);
    }

    await writeDB(db);

    const enriched = { ...message, userName: req.user.name, userEmail: req.user.email };
    try { emitWorkspaceMessage(id, { type: "new", message: enriched }); } catch (_) {}

    res.status(201).json({ success: true, message: enriched });
  } catch (err) { next(err); }
}

async function editMessage(req, res, next) {
  try {
    const { id, msgId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    const db = await readDB();
    const message = (db.workspaceMessages || []).find(
      (m) => m.id === msgId && m.workspaceId === id
    );
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (message.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages." });
    }

    message.content = content.trim();
    message.editedAt = new Date().toISOString();

    await writeDB(db);

    try { emitWorkspaceMessage(id, { type: "edited", message }); } catch (_) {}

    res.json({ success: true, message });
  } catch (err) { next(err); }
}

async function deleteMessage(req, res, next) {
  try {
    const { id, msgId } = req.params;
    const { deleteFrom } = req.body;
    const db = await readDB();

    const message = (db.workspaceMessages || []).find(
      (m) => m.id === msgId && m.workspaceId === id
    );
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (message.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (message.userId === req.user.id && deleteFrom === "me") {
      if (!message.deletedFor) message.deletedFor = [];
      if (!message.deletedFor.includes(req.user.id)) {
        message.deletedFor.push(req.user.id);
      }
      await writeDB(db);
      return res.json({ success: true, message: "Message deleted from your view." });
    }

    message.deletedAt = new Date().toISOString();
    message.content = "";
    await writeDB(db);

    try { emitWorkspaceMessage(id, { type: "deleted", messageId: msgId, workspaceId: id }); } catch (_) {}

    res.json({ success: true, message: "Message deleted." });
  } catch (err) { next(err); }
}

module.exports = {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getMembers,
  addMember,
  removeMember,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
};
