import api from "./apiClient";

const BASE = "/api/hierarchy";

export function getHierarchy() {
  return api.get(BASE);
}

export function createHierarchyNode(data) {
  return api.post(BASE, data);
}

export function updateHierarchyNode(id, data) {
  return api.put(`${BASE}/${id}`, data);
}

export function deleteHierarchyNode(id) {
  return api.delete(`${BASE}/${id}`);
}
