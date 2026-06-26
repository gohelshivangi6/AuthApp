import api from "./apiClient";

const BASE = "/api/chat";

export function getUsers() {
  return api.get(`${BASE}/users`);
}

export function createConversation(participantId) {
  return api.post(`${BASE}/conversations`, { participantId });
}

export function getConversations() {
  return api.get(`${BASE}/conversations`);
}

export function getMessages(id, params) {
  return api.get(`${BASE}/conversations/${id}/messages`, { params });
}

export function sendMessage(id, content) {
  return api.post(`${BASE}/conversations/${id}/messages`, { content });
}

export function deleteMessage(id, msgId, deleteFrom) {
  return api.delete(`${BASE}/conversations/${id}/messages/${msgId}`, { data: { deleteFrom } });
}

export function getOnlineUsers() {
  return api.get(`${BASE}/online`);
}
