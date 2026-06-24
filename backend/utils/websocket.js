const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("./dbHelper");
const { sendInactivityWarningEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret_for_development_purposes";

let io = null;
const userSockets = new Map(); // userId -> Set<socketId>
const socketMetadata = new Map(); // socketId -> { userId, sessionId }
const lastActivityLog = new Map(); // userId -> timestamp, throttles activity log writes

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [FRONTEND_URL, FRONTEND_URL.replace('localhost', '127.0.0.1')],
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

    emitAdminUserStatus(userId, "active");

    (async () => {
      try {
        const db = await readDB();
        const workspaceIds = (db.workspaceMembers || [])
          .filter((m) => m.userId === userId)
          .map((m) => m.workspaceId);
        for (const wid of workspaceIds) {
          socket.join(`workspace:${wid}`);
        }

        const user = db.users.find((u) => u.id === userId);
        if (user && user.pendingInactivityLogout) {
          const now = Date.now();
          const expiresAt = new Date(user.pendingInactivityLogout).getTime();
          if (expiresAt > now) {
            socket.emit("inactivity-warning", { userId });
          }
        }
      } catch (err) {
        console.error("[WS] init handler error for user", userId, err.message);
      }
    })();

    socket.on("event", async (data) => {
      try {
        const db = await readDB();
        const now = Date.now();

        const lastLog = lastActivityLog.get(userId) || 0;
        let didLog = false;
        if (now - lastLog >= 30000) {
          if (!db.activityLogs) db.activityLogs = [];
          db.activityLogs.push({
            id: uuidv4(),
            userId,
            type: "event",
            timestamp: new Date().toISOString(),
            metadata: {
              ...(data.metadata || {}),
              sessionId,
              eventType: data.eventType || "custom",
            },
          });
          if (db.activityLogs.length > 10000) {
            db.activityLogs = db.activityLogs.slice(-5000);
          }
          lastActivityLog.set(userId, now);
          didLog = true;
        }

        const user = db.users.find((u) => u.id === userId);
        if (user) {
          const lastActive = user.lastActivityAt
            ? new Date(user.lastActivityAt).getTime()
            : 0;
          if (now - lastActive > 30000) {
            user.lastActivityAt = new Date().toISOString();
          }
        }

        await writeDB(db);
        if (didLog && io) {
          io.of("/user").emit("stats-updated");
        }
      } catch (err) {
        console.error("[WS] event handler error for user", userId, err.message);
      }
    });

    socket.on("page_view", async (data) => {
      try {
        const db = await readDB();
        if (!db.activityLogs) db.activityLogs = [];
        db.activityLogs.push({
          id: uuidv4(),
          userId,
          type: "page_view",
          timestamp: new Date().toISOString(),
          metadata: { path: data.path || "/", sessionId },
        });
        if (db.activityLogs.length > 10000) {
          db.activityLogs = db.activityLogs.slice(-5000);
        }

        const user = db.users.find((u) => u.id === userId);
        if (user) {
          const now = Date.now();
          const lastActive = user.lastActivityAt
            ? new Date(user.lastActivityAt).getTime()
            : 0;
          if (now - lastActive > 30000) {
            user.lastActivityAt = new Date().toISOString();
          }
        }

        await writeDB(db);
        if (io) {
          io.of("/user").emit("stats-updated");
        }
      } catch (err) {
        console.error("[WS] page_view handler error for user", userId, err.message);
      }
    });

    socket.on("inactivity-warning-triggered", async () => {
      try {
        const db = await readDB();
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          const token = uuidv4();
          user.pendingInactivityLogout = new Date(Date.now() + 2 * 60 * 1000).toISOString();
          user.inactivityToken = token;
          await writeDB(db);
          await sendInactivityWarningEmail(user, token);
          emitAdminUserStatus(userId, "warning");
        }
      } catch (err) {
        console.error("[WS] inactivity-warning-triggered error:", err.message);
      }
    });

    socket.on("stayed-active", async () => {
      try {
        const db = await readDB();
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.pendingInactivityLogout = null;
          user.inactivityToken = null;
          user.lastActivityAt = new Date().toISOString();
          await writeDB(db);
          emitAdminUserStatus(userId, "active");
        }
      } catch (err) {
        console.error("[WS] stayed-active error:", err.message);
      }
    });

    socket.on("inactivity-logout", async () => {
      try {
        const db = await readDB();
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.adminForceLoggedOutAt = new Date().toISOString();
          user.pendingInactivityLogout = null;
          user.inactivityToken = null;
          await writeDB(db);
          emitAdminUserStatus(userId, "logged-out");
        }
      } catch (err) {
        console.error("[WS] inactivity-logout error:", err.message);
      }
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
      }
      // Don't delete userId from userSockets — user stays "logged in" even without WS connection.
      // Only remove on explicit logout via removeLoggedOutUser().
      
      // Tell admin they disconnected (but may still be authenticated)
      if (!userSockets.get(userId) || userSockets.get(userId).size === 0) {
        emitAdminUserStatus(userId, "offline");
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
  } catch (err) {
    console.error("[WS] logActivity error:", err.message);
  }
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

async function emitAdminUserStatus(userId, status) {
  if (!io) return;
  
  let userData = null;
  if (status === "active" || status === "warning") {
    try {
      const { readDB } = require("./dbHelper");
      const db = await readDB();
      const user = db.users.find(u => u.id === userId);
      if (user) {
        const now = Date.now();
        const lastActive = user.lastActivityAt ? new Date(user.lastActivityAt).getTime() : null;
        const sessionDuration = lastActive ? Math.floor((now - lastActive) / 1000) : 0;
        userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user",
          lastActivityAt: user.lastActivityAt,
          sessionDurationSec: sessionDuration,
          hasInactivityWarning: !!user.pendingInactivityLogout,
        };
      }
    } catch (err) {
      console.error("[WS] emitAdminUserStatus error:", err.message);
    }
  }
  
  io.of("/admin").to("admin").emit("user-status-changed", { userId, status, user: userData });
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
  } catch (err) {
    console.error("[WS] addUserToWorkspaceRoom error:", err.message);
  }
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
  let count = 0;
  for (const [_, sockets] of userSockets) {
    if (sockets.size > 0) count++;
  }
  return count;
}

function getActiveUserIds() {
  return Array.from(userSockets.keys());
}

function removeLoggedOutUser(userId) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      socketMetadata.delete(socketId);
    }
  }
  userSockets.delete(userId);
  emitAdminUserStatus(userId, "logged-out");
}

async function updateLastActivity(userId) {
  try {
    const db = await readDB();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      const lastActive = user.lastActivityAt ? new Date(user.lastActivityAt).getTime() : 0;
      if (Date.now() - lastActive > 30000) {
        user.lastActivityAt = new Date().toISOString();
        await writeDB(db);
      }
    }
  } catch (err) {
    console.error("[WS] updateLastActivity error for user", userId, err.message);
  }
}

function emitInactivityWarning(userId) {
  if (!io) return;
  io.of("/user").to(`user:${userId}`).emit("inactivity-warning", { userId });
}

function forceDisconnectUser(userId) {
  if (!io) return;
  const sockets = userSockets.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      const socket = io.of("/user").sockets?.get(socketId);
      if (socket) {
        socket.emit("force-logout", { userId });
        socket.disconnect(true);
      }
    }
  }
  removeLoggedOutUser(userId);
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
  removeLoggedOutUser,
  emitInactivityWarning,
  forceDisconnectUser,
  emitAdminUserStatus,
};
