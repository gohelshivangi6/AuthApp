import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/api/admin";

export const fetchUsers = createAsyncThunk("admin/fetchUsers", async () => {
  const res = await axios.get(`${API}/users`, { withCredentials: true });
  return res.data.users;
});

export const createUser = createAsyncThunk("admin/createUser", async (data) => {
  const res = await axios.post(`${API}/users`, data, { withCredentials: true });
  return res.data.user;
});

export const bulkCreateUsers = createAsyncThunk("admin/bulkCreateUsers", async (users) => {
  const res = await axios.post(`${API}/users/bulk`, { users }, { withCredentials: true });
  return res.data;
});

export const updateUser = createAsyncThunk("admin/updateUser", async ({ id, ...data }) => {
  await axios.put(`${API}/users/${id}`, data, { withCredentials: true });
  return { id, ...data };
});

export const deleteUser = createAsyncThunk("admin/deleteUser", async (id) => {
  await axios.delete(`${API}/users/${id}`, { withCredentials: true });
  return id;
});

export const fetchDepartments = createAsyncThunk("admin/fetchDepartments", async () => {
  const res = await axios.get(`${API}/departments`, { withCredentials: true });
  return res.data.departments;
});

export const createDepartment = createAsyncThunk("admin/createDepartment", async (data) => {
  const res = await axios.post(`${API}/departments`, data, { withCredentials: true });
  return res.data.department;
});

export const updateDepartment = createAsyncThunk("admin/updateDepartment", async ({ id, ...data }) => {
  const res = await axios.put(`${API}/departments/${id}`, data, { withCredentials: true });
  return res.data.department;
});

export const deleteDepartment = createAsyncThunk("admin/deleteDepartment", async (id) => {
  await axios.delete(`${API}/departments/${id}`, { withCredentials: true });
  return id;
});

export const fetchRoles = createAsyncThunk("admin/fetchRoles", async (departmentId) => {
  const params = departmentId ? `?departmentId=${departmentId}` : "";
  const res = await axios.get(`${API}/roles${params}`, { withCredentials: true });
  console.log("roles ", res.data);
  return res.data.roles;
});

export const createRole = createAsyncThunk("admin/createRole", async (data) => {
  const res = await axios.post(`${API}/roles`, data, { withCredentials: true });
  return res.data.role;
});

export const updateRole = createAsyncThunk("admin/updateRole", async ({ id, ...data }) => {
  const res = await axios.put(`${API}/roles/${id}`, data, { withCredentials: true });
  return res.data.role;
});

export const deleteRole = createAsyncThunk("admin/deleteRole", async (id) => {
  await axios.delete(`${API}/roles/${id}`, { withCredentials: true });
  return id;
});

export const fetchAssignments = createAsyncThunk("admin/fetchAssignments", async () => {
  const res = await axios.get(`${API}/assignments`, { withCredentials: true });
  return res.data.assignments;
});

export const createAssignment = createAsyncThunk("admin/createAssignment", async (data) => {
  const res = await axios.post(`${API}/assignments`, data, { withCredentials: true });
  return res.data.assignment;
});

export const deleteAssignment = createAsyncThunk("admin/deleteAssignment", async (id) => {
  await axios.delete(`${API}/assignments/${id}`, { withCredentials: true });
  return id;
});

export const fetchPermissions = createAsyncThunk("admin/fetchPermissions", async (userId) => {
  const params = userId ? `?userId=${userId}` : "";
  const res = await axios.get(`${API}/permissions${params}`, { withCredentials: true });
  return res.data.permissions;
});

export const createPermission = createAsyncThunk("admin/createPermission", async (data) => {
  const res = await axios.post(`${API}/permissions`, data, { withCredentials: true });
  return res.data.permission;
});

export const deletePermission = createAsyncThunk("admin/deletePermission", async (id) => {
  await axios.delete(`${API}/permissions/${id}`, { withCredentials: true });
  return id;
});

export const bulkCreatePermissions = createAsyncThunk("admin/bulkCreatePermissions", async (data) => {
  const res = await axios.post(`${API}/permissions/bulk`, data, { withCredentials: true });
  return res.data;
});

export const bulkSavePermissions = createAsyncThunk("admin/bulkSavePermissions", async (data) => {
  const res = await axios.post(`${API}/permissions/bulk-save`, data, { withCredentials: true });
  return res.data;
});

export const fetchPermissionTemplates = createAsyncThunk("admin/fetchPermissionTemplates", async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${API}/permission-templates${query ? `?${query}` : ""}`, { withCredentials: true });
  return res.data.permissionTemplates;
});

export const upsertPermissionTemplate = createAsyncThunk("admin/upsertPermissionTemplate", async (data) => {
  const res = await axios.post(`${API}/permission-templates`, data, { withCredentials: true });
  return res.data.permissionTemplate;
});

export const deletePermissionTemplate = createAsyncThunk("admin/deletePermissionTemplate", async (id) => {
  await axios.delete(`${API}/permission-templates/${id}`, { withCredentials: true });
  return id;
});

export const applyDepartmentPermission = createAsyncThunk("admin/applyDepartmentPermission", async (data) => {
  const res = await axios.post(`${API}/permissions/apply-department`, data, { withCredentials: true });
  return res.data;
});

export const applyRolePermission = createAsyncThunk("admin/applyRolePermission", async (data) => {
  const res = await axios.post(`${API}/permissions/apply-role`, data, { withCredentials: true });
  return res.data;
});

export const fetchWidgets = createAsyncThunk("admin/fetchWidgets", async () => {
  const res = await axios.get(`${API}/widgets`, { withCredentials: true });
  return res.data.widgets;
});

export const createWidget = createAsyncThunk("admin/createWidget", async (data) => {
  const res = await axios.post(`${API}/widgets`, data, { withCredentials: true });
  return res.data.widget;
});

export const updateWidget = createAsyncThunk("admin/updateWidget", async ({ id, ...data }) => {
  const res = await axios.put(`${API}/widgets/${id}`, data, { withCredentials: true });
  return res.data.widget;
});

export const deleteWidget = createAsyncThunk("admin/deleteWidget", async (id) => {
  await axios.delete(`${API}/widgets/${id}`, { withCredentials: true });
  return id;
});

export const fetchDashboards = createAsyncThunk("admin/fetchDashboards", async () => {
  const res = await axios.get(`${API}/dashboards`, { withCredentials: true });
  return res.data.dashboards;
});

export const fetchDashboardLayout = createAsyncThunk("admin/fetchDashboardLayout", async (slug) => {
  const res = await axios.get(`${API}/dashboards/${slug}/layout`, { withCredentials: true });
  return res.data.layout;
});

export const saveDashboardLayout = createAsyncThunk("admin/saveDashboardLayout", async ({ slug, layout }) => {
  const res = await axios.put(`${API}/dashboards/${slug}/layout`, layout, { withCredentials: true });
  return res.data.layout;
});

export const fetchStats = createAsyncThunk("admin/fetchStats", async () => {
  const res = await axios.get(`${API}/stats`, { withCredentials: true });
  return res.data.stats;
});

export const fetchActivityLogs = createAsyncThunk("admin/fetchActivityLogs", async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${API}/activity-logs?${query}`, { withCredentials: true });
  return res.data;
});

export const fetchUserStats = createAsyncThunk("admin/fetchUserStats", async (userId) => {
  const res = await axios.get(`${API}/users/${userId}/stats`, { withCredentials: true });
  return res.data.userStats;
});

export const fetchInactiveUsers = createAsyncThunk("admin/fetchInactiveUsers", async () => {
  const res = await axios.get(`${API}/users/inactive`, { withCredentials: true });
  return res.data.users;
});

export const fetchPendingDeletions = createAsyncThunk("admin/fetchPendingDeletions", async () => {
  const res = await axios.get(`${API}/users/pending-deletion`, { withCredentials: true });
  return res.data.users;
});

export const markForDeletion = createAsyncThunk("admin/markForDeletion", async (id) => {
  await axios.post(`${API}/users/${id}/mark-for-deletion`, {}, { withCredentials: true });
  return id;
});

export const cancelDeletion = createAsyncThunk("admin/cancelDeletion", async (id) => {
  await axios.post(`${API}/users/${id}/cancel-deletion`, {}, { withCredentials: true });
  return id;
});

export const bulkDeleteUsers = createAsyncThunk("admin/bulkDeleteUsers", async (userIds) => {
  await axios.post(`${API}/users/bulk-delete`, { userIds }, { withCredentials: true });
  return userIds;
});

export const bulkSuspendUsers = createAsyncThunk("admin/bulkSuspendUsers", async ({ userIds, suspended }) => {
  await axios.post(`${API}/users/bulk-suspend`, { userIds, suspended }, { withCredentials: true });
  return { userIds: new Set(userIds), suspended };
});

export const cloneRole = createAsyncThunk("admin/cloneRole", async ({ id, ...data }) => {
  const res = await axios.post(`${API}/roles/${id}/clone`, data, { withCredentials: true });
  return res.data.role;
});

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    departments: [],
    roles: [],
    assignments: [],
    permissions: [],
    permissionTemplates: [],
    widgets: [],
    dashboards: [],
    dashboardLayout: null,
    stats: null,
    activityLogs: [],
    activityLogsTotal: 0,
    selectedUserId: null,
    userStats: null,
    inactiveUsers: [],
    pendingDeletions: [],
    loading: false,
  },
  reducers: {
    setSelectedUserId(state, action) {
      state.selectedUserId = action.payload;
    },
    clearUserStats(state) {
      state.userStats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => { state.users = action.payload; })
      .addCase(createUser.fulfilled, (state, action) => { state.users.push(action.payload); })
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx >= 0) Object.assign(state.users[idx], action.payload);
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => { state.departments = action.payload; })
      .addCase(createDepartment.fulfilled, (state, action) => { state.departments.push(action.payload); })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const idx = state.departments.findIndex((d) => d.id === action.payload.id);
        if (idx >= 0) state.departments[idx] = action.payload;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter((d) => d.id !== action.payload);
      })
      .addCase(fetchRoles.fulfilled, (state, action) => { state.roles = action.payload; })
      .addCase(createRole.fulfilled, (state, action) => { state.roles.push(action.payload); })
      .addCase(updateRole.fulfilled, (state, action) => {
        const idx = state.roles.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.roles[idx] = action.payload;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter((r) => r.id !== action.payload);
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => { state.assignments = action.payload; })
      .addCase(createAssignment.fulfilled, (state, action) => { state.assignments.push(action.payload); })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.assignments = state.assignments.filter((a) => a.id !== action.payload);
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => { state.permissions = action.payload; })
      .addCase(createPermission.fulfilled, (state, action) => {
        const idx = state.permissions.findIndex(
          (p) => p.targetType === action.payload.targetType && p.targetId === action.payload.targetId && p.userId === action.payload.userId
        );
        if (idx >= 0) state.permissions[idx] = action.payload;
        else state.permissions.push(action.payload);
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter((p) => p.id !== action.payload);
      })
      .addCase(bulkCreatePermissions.fulfilled, () => {})
      .addCase(fetchPermissionTemplates.fulfilled, (state, action) => { state.permissionTemplates = action.payload; })
      .addCase(upsertPermissionTemplate.fulfilled, (state, action) => {
        const idx = state.permissionTemplates.findIndex(
          (t) => t.assigneeType === action.payload.assigneeType
            && t.assigneeId === action.payload.assigneeId
            && t.targetType === action.payload.targetType
            && t.targetId === action.payload.targetId
        );
        if (idx >= 0) state.permissionTemplates[idx] = action.payload;
        else state.permissionTemplates.push(action.payload);
      })
      .addCase(deletePermissionTemplate.fulfilled, (state, action) => {
        state.permissionTemplates = state.permissionTemplates.filter((t) => t.id !== action.payload);
      })
      .addCase(fetchWidgets.fulfilled, (state, action) => { state.widgets = action.payload; })
      .addCase(createWidget.fulfilled, (state, action) => { state.widgets.push(action.payload); })
      .addCase(updateWidget.fulfilled, (state, action) => {
        const idx = state.widgets.findIndex((w) => w.id === action.payload.id);
        if (idx >= 0) state.widgets[idx] = action.payload;
      })
      .addCase(deleteWidget.fulfilled, (state, action) => {
        state.widgets = state.widgets.filter((w) => w.id !== action.payload);
      })
      .addCase(fetchDashboards.fulfilled, (state, action) => { state.dashboards = action.payload; })
      .addCase(fetchDashboardLayout.fulfilled, (state, action) => { state.dashboardLayout = action.payload; })
      .addCase(saveDashboardLayout.fulfilled, (state, action) => { state.dashboardLayout = action.payload; })
      .addCase(fetchStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.activityLogs = action.payload.logs;
        state.activityLogsTotal = action.payload.total;
      })
      .addCase(fetchInactiveUsers.fulfilled, (state, action) => { state.inactiveUsers = action.payload; })
      .addCase(fetchPendingDeletions.fulfilled, (state, action) => { state.pendingDeletions = action.payload; })
      .addCase(markForDeletion.fulfilled, (state, action) => {
        state.inactiveUsers = state.inactiveUsers.filter((u) => u.id !== action.payload);
      })
      .addCase(cancelDeletion.fulfilled, (state, action) => {
        state.pendingDeletions = state.pendingDeletions.filter((u) => u.id !== action.payload);
      })
      .addCase(bulkDeleteUsers.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        state.users = state.users.filter((u) => !ids.has(u.id));
      })
      .addCase(bulkSuspendUsers.fulfilled, (state, action) => {
        const { userIds, suspended } = action.payload;
        state.users.forEach((u) => {
          if (userIds.has(u.id)) u.suspended = suspended;
        });
      })
      .addCase(cloneRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => { state.userStats = action.payload; })
      .addMatcher(
        (action) => action.type.startsWith("admin/") && action.type.endsWith("/pending"),
        (state) => { state.loading = true; }
      )
      .addMatcher(
        (action) => action.type.startsWith("admin/") && (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")),
        (state) => { state.loading = false; }
      );
  },
});

export const { setSelectedUserId, clearUserStats } = adminSlice.actions;
export default adminSlice.reducer;
