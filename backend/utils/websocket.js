const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("./dbHelper");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret_for_development_purposes";

let io = null;
const userSockets = new Map(); // userId -> Set<socketId>
const socketMetadata = new Map(); // socketId -> { userId, sessionId }

function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    },
  });

  const userNamespace = io.of("/user");

  userNamespace.on("connection", (socket) => {
    let userId = null;
    let sessionId = null;

    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      }
    } catch (_) {}

    if (!userId) {
      socket.disconnect();
      return;
    }

    sessionId = uuidv4();

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    socketMetadata.set(socket.id, { userId, sessionId });

    logActivity(userId, "session_start", { sessionId, ip: socket.handshake.address });

    socket.join(`user:${userId}`);

    (async () => {
      try {
        const db = await readDB();
        const workspaceIds = (db.workspaceMembers || [])
          .filter((m) => m.userId === userId)
          .map((m) => m.workspaceId);
        for (const wid of workspaceIds) {
          socket.join(`workspace:${wid}`);
        }
      } catch (_) {}
    })();

    socket.on("event", async (data) => {
      try {
        await logActivity(userId, "event", {
          ...(data.metadata || {}),
          sessionId,
          eventType: data.eventType || "custom",
        });
      } catch (_) {}
    });

    socket.on("page_view", async (data) => {
      try {
        await logActivity(userId, "page_view", {
          path: data.path || "/",
          sessionId,
        });
      } catch (_) {}
    });

    socket.on("disconnect", async () => {
      const meta = socketMetadata.get(socket.id);
      if (meta) {
        const durationMs = meta.sessionStart ? Date.now() - meta.sessionStart : 0;
        await logActivity(userId, "session_end", {
          sessionId: meta.sessionId,
          durationMs,
        });
        socketMetadata.delete(socket.id);
      }

      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }

      meta.sessionStart = Date.now();
    });

    const meta = socketMetadata.get(socket.id);
    if (meta) meta.sessionStart = Date.now();
  });

  const adminNamespace = io.of("/admin");

  adminNamespace.on("connection", (socket) => {
    let userId = null;
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      }
    } catch (_) {}

    if (!userId) {
      socket.disconnect();
      return;
    }

    (async () => {
      try {
        const db = await readDB();
        const user = db.users.find((u) => u.id === userId);
        if (!user || user.role !== "admin") {
          socket.disconnect();
          return;
        }

        socket.join("admin");

        socket.on("disconnect", () => {});
      } catch (_) {
        socket.disconnect();
      }
    })();
  });

  console.log("[WebSocket] Socket.io initialized");
  return io;
}

async function logActivity(userId, type, metadata = {}) {
  try {
    const db = await readDB();
    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.push({
      id: uuidv4(),
      userId,
      type,
      timestamp: new Date().toISOString(),
      metadata,
    });
    if (db.activityLogs.length > 10000) {
      db.activityLogs = db.activityLogs.slice(-5000);
    }
    await writeDB(db);
    if (io) {
      io.of("/user").emit("stats-updated");
    }
  } catch (_) {}
}

function emitPermissionUpdate(userId, data = {}) {
  if (!io) return;
  io.of("/user").to(`user:${userId}`).emit("permissions-updated", { userId, ...data });
}

function emitBulkPermissionUpdate(userIds, data = {}) {
  if (!io) return;
  for (const userId of userIds) {
    io.of("/user").to(`user:${userId}`).emit("permissions-updated", { userId, ...data });
  }
}

function emitLayoutUpdate(slug) {
  if (!io) return;
  io.of("/user").emit("layout-updated", { slug });
}

function emitDeletionUpdate(data = {}) {
  if (!io) return;
  io.of("/admin").to("admin").emit("deletion-update", data);
}

function emitWorkspaceMessage(workspaceId, data = {}) {
  if (!io) return;
  io.of("/user").to(`workspace:${workspaceId}`).emit("workspace-message", data);
}

async function joinUserWorkspaceRooms(userId) {
  if (!io) return;
  try {
    const db = await readDB();
    const workspaceIds = (db.workspaceMembers || [])
      .filter((m) => m.userId === userId)
      .map((m) => m.workspaceId);
    const sockets = userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        const socket = io.of("/user").sockets?.get(socketId);
        if (socket) {
          for (const wid of workspaceIds) {
            socket.join(`workspace:${wid}`);
          }
        }
      }
    }
  } catch (_) {}
}

async function removeUserFromWorkspaceRoom(userId, workspaceId) {
  if (!io) return;
  const sockets = userSockets.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      const socket = io.of("/user").sockets?.get(socketId);
      if (socket) {
        socket.leave(`workspace:${workspaceId}`);
      }
    }
  }
}

function getActiveUsersCount() {
  return userSockets.size;
}

function getActiveUserIds() {
  return Array.from(userSockets.keys());
}

module.exports = {
  initWebSocket,
  emitPermissionUpdate,
  emitBulkPermissionUpdate,
  emitLayoutUpdate,
  emitDeletionUpdate,
  emitWorkspaceMessage,
  joinUserWorkspaceRooms,
  removeUserFromWorkspaceRoom,
  getActiveUsersCount,
  getActiveUserIds,
};
