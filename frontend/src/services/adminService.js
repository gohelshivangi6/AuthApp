import api from "./apiClient";

const BASE = "/api/admin";

export function getUsers() {
  return api.get(`${BASE}/users`);
}

export function createUser(data) {
  return api.post(`${BASE}/users`, data);
}

export function updateUser(id, data) {
  return api.put(`${BASE}/users/${id}`, data);
}

export function deleteUser(id) {
  return api.delete(`${BASE}/users/${id}`);
}

export function bulkCreateUsers(users) {
  return api.post(`${BASE}/users/bulk`, { users });
}

export function bulkDeleteUsers(userIds) {
  return api.post(`${BASE}/users/bulk-delete`, { userIds });
}

export function bulkSuspendUsers(userIds, suspend) {
  return api.post(`${BASE}/users/bulk-suspend`, { userIds, suspend });
}

export function getDepartments() {
  return api.get(`${BASE}/departments`);
}

export function createDepartment(data) {
  return api.post(`${BASE}/departments`, data);
}

export function updateDepartment(id, data) {
  return api.put(`${BASE}/departments/${id}`, data);
}

export function deleteDepartment(id) {
  return api.delete(`${BASE}/departments/${id}`);
}

export function getRoles(departmentId) {
  const params = departmentId ? { departmentId } : {};
  return api.get(`${BASE}/roles`, { params });
}

export function createRole(data) {
  return api.post(`${BASE}/roles`, data);
}

export function updateRole(id, data) {
  return api.put(`${BASE}/roles/${id}`, data);
}

export function deleteRole(id) {
  return api.delete(`${BASE}/roles/${id}`);
}

export function cloneRole(id, newName) {
  return api.post(`${BASE}/roles/${id}/clone`, { name: newName });
}

export function getAssignments() {
  return api.get(`${BASE}/assignments`);
}

export function createAssignment(data) {
  return api.post(`${BASE}/assignments`, data);
}

export function updateAssignment(id, data) {
  return api.put(`${BASE}/assignments/${id}`, data);
}

export function deleteAssignment(id) {
  return api.delete(`${BASE}/assignments/${id}`);
}

export function getPermissions(userId) {
  const params = userId ? { userId } : {};
  return api.get(`${BASE}/permissions`, { params });
}

export function createPermission(data) {
  return api.post(`${BASE}/permissions`, data);
}

export function deletePermission(id) {
  return api.delete(`${BASE}/permissions/${id}`);
}

export function bulkCreatePermissions(permissions) {
  return api.post(`${BASE}/permissions/bulk`, { permissions });
}

export function bulkSavePermissions(permissions) {
  return api.post(`${BASE}/permissions/bulk-save`, { permissions });
}

export function getPermissionTemplates() {
  return api.get(`${BASE}/permission-templates`);
}

export function upsertPermissionTemplate(data) {
  return api.post(`${BASE}/permission-templates`, data);
}

export function deletePermissionTemplate(id) {
  return api.delete(`${BASE}/permission-templates/${id}`);
}

export function applyDepartmentPermission(data) {
  return api.post(`${BASE}/permissions/apply-department`, data);
}

export function applyRolePermission(data) {
  return api.post(`${BASE}/permissions/apply-role`, data);
}

export function getWidgets() {
  return api.get(`${BASE}/widgets`);
}

export function createWidget(data) {
  return api.post(`${BASE}/widgets`, data);
}

export function updateWidget(id, data) {
  return api.put(`${BASE}/widgets/${id}`, data);
}

export function deleteWidget(id) {
  return api.delete(`${BASE}/widgets/${id}`);
}

export function getDashboards() {
  return api.get(`${BASE}/dashboards`);
}

export function getDashboardLayout(slug) {
  return api.get(`${BASE}/dashboards/${slug}/layout`);
}

export function updateDashboardLayout(slug, layout) {
  return api.put(`${BASE}/dashboards/${slug}/layout`, { layout });
}

export function getStats() {
  return api.get(`${BASE}/stats`);
}

export function getActivityLogs(params) {
  return api.get(`${BASE}/activity-logs`, { params });
}

export function getUserStats(userId) {
  return api.get(`${BASE}/users/${userId}/stats`);
}

export function getActiveUsers() {
  return api.get(`${BASE}/users/active`);
}

export function forceLogoutUser(userId) {
  return api.post(`${BASE}/users/${userId}/force-logout`);
}
