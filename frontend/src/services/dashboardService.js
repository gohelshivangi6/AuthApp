import api from "./apiClient";

export function getDashboardData() {
  return api.get("/api/dashboard/data");
}

export function getAllowedDashboards() {
  return api.get("/api/dashboard/allowed");
}

export function getSectionPermissions() {
  return api.get("/api/dashboard/section-permissions");
}

export function getDashboardDataBySlug(slug) {
  return api.get(`/api/dashboard-data/${slug}`);
}

export function getDashboardLayout(slug) {
  return api.get(`/api/dashboard-data/${slug}/layout`);
}

export function updateDashboardLayout(slug, layout) {
  return api.put(`/api/dashboard-data/${slug}/layout`, { layout });
}
