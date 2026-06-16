import { io } from "socket.io-client";

const WS_URL = "http://localhost:5000";

let socket = null;
let adminSocket = null;

export function connectUserSocket(token) {
  if (socket?.connected) return socket;

  socket = io(`${WS_URL}/user`, {
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("[WS] User socket connected");
  });

  socket.on("disconnect", (reason) => {
    console.log("[WS] User socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[WS] Connection error:", err.message);
  });

  return socket;
}

export function connectAdminSocket(token) {
  if (adminSocket?.connected) return adminSocket;

  adminSocket = io(`${WS_URL}/admin`, {
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  adminSocket.on("connect", () => {
    console.log("[WS] Admin socket connected");
  });

  adminSocket.on("disconnect", (reason) => {
    console.log("[WS] Admin socket disconnected:", reason);
  });

  return adminSocket;
}

export function getUserSocket() {
  return socket;
}

export function getAdminSocket() {
  return adminSocket;
}

export function disconnectSockets() {
  if (socket) { socket.disconnect(); socket = null; }
  if (adminSocket) { adminSocket.disconnect(); adminSocket = null; }
}

export function emitPageView(path) {
  if (socket?.connected) {
    socket.emit("page_view", { path });
  }
}

export function emitEvent(eventType, metadata = {}) {
  if (socket?.connected) {
    socket.emit("event", { eventType, metadata });
  }
}
