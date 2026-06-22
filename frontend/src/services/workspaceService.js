import api from "./apiClient";

const BASE = "/api/workspaces";

export function getWorkspaces() {
  return api.get(BASE);
}

export function createWorkspace(name, description) {
  return api.post(BASE, { name, description });
}

export function updateWorkspace(id, data) {
  return api.put(`${BASE}/${id}`, data);
}

export function deleteWorkspace(id) {
  return api.delete(`${BASE}/${id}`);
}

export function getMembers(id) {
  return api.get(`${BASE}/${id}/members`);
}

export function addMember(id, userId) {
  return api.post(`${BASE}/${id}/members`, { userId });
}

export function removeMember(id, userId) {
  return api.delete(`${BASE}/${id}/members/${userId}`);
}

export function getMessages(id, params) {
  return api.get(`${BASE}/${id}/messages`, { params });
}

export function sendMessage(id, content) {
  return api.post(`${BASE}/${id}/messages`, { content });
}

export function editMessage(id, msgId, content) {
  return api.put(`${BASE}/${id}/messages/${msgId}`, { content });
}

export function deleteMessage(id, msgId, deleteFrom) {
  return api.delete(`${BASE}/${id}/messages/${msgId}`, { data: { deleteFrom } });
}
