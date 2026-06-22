import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as adminService from "../../services/adminService";

export const fetchUsers = createAsyncThunk("admin/fetchUsers", async () => {
  const res = await adminService.getUsers();
  return res.data.users;
});

export const createUser = createAsyncThunk("admin/createUser", async (data) => {
  const res = await adminService.createUser(data);
  return res.data.user;
});

export const bulkCreateUsers = createAsyncThunk("admin/bulkCreateUsers", async (users) => {
  const res = await adminService.bulkCreateUsers(users);
  return res.data;
});

export const updateUser = createAsyncThunk("admin/updateUser", async ({ id, ...data }) => {
  await adminService.updateUser(id, data);
  return { id, ...data };
});

export const deleteUser = createAsyncThunk("admin/deleteUser", async (id) => {
  await adminService.deleteUser(id);
  return id;
});

export const fetchDepartments = createAsyncThunk("admin/fetchDepartments", async () => {
  const res = await adminService.getDepartments();
  return res.data.departments;
});

export const createDepartment = createAsyncThunk("admin/createDepartment", async (data) => {
  const res = await adminService.createDepartment(data);
  return res.data.department;
});

export const updateDepartment = createAsyncThunk("admin/updateDepartment", async ({ id, ...data }) => {
  const res = await adminService.updateDepartment(id, data);
  return res.data.department;
});

export const deleteDepartment = createAsyncThunk("admin/deleteDepartment", async (id) => {
  await adminService.deleteDepartment(id);
  return id;
});

export const fetchRoles = createAsyncThunk("admin/fetchRoles", async (departmentId) => {
  const res = await adminService.getRoles(departmentId);
  return res.data.roles;
});

export const createRole = createAsyncThunk("admin/createRole", async (data) => {
  const res = await adminService.createRole(data);
  return res.data.role;
});

export const updateRole = createAsyncThunk("admin/updateRole", async ({ id, ...data }) => {
  const res = await adminService.updateRole(id, data);
  return res.data.role;
});

export const deleteRole = createAsyncThunk("admin/deleteRole", async (id) => {
  await adminService.deleteRole(id);
  return id;
});

export const fetchAssignments = createAsyncThunk("admin/fetchAssignments", async () => {
  const res = await adminService.getAssignments();
  return res.data.assignments;
});

export const createAssignment = createAsyncThunk("admin/createAssignment", async (data) => {
  const res = await adminService.createAssignment(data);
  return res.data.assignment;
});

export const deleteAssignment = createAsyncThunk("admin/deleteAssignment", async (id) => {
  await adminService.deleteAssignment(id);
  return id;
});

export const fetchPermissions = createAsyncThunk("admin/fetchPermissions", async (userId) => {
  const res = await adminService.getPermissions(userId);
  return res.data.permissions;
});

export const createPermission = createAsyncThunk("admin/createPermission", async (data) => {
  const res = await adminService.createPermission(data);
  return res.data.permission;
});

export const deletePermission = createAsyncThunk("admin/deletePermission", async (id) => {
  await adminService.deletePermission(id);
  return id;
});

export const bulkCreatePermissions = createAsyncThunk("admin/bulkCreatePermissions", async (data) => {
  const res = await adminService.bulkCreatePermissions(data.permissions);
  return res.data;
});

export const bulkSavePermissions = createAsyncThunk("admin/bulkSavePermissions", async (data) => {
  const res = await adminService.bulkSavePermissions(data.permissions);
  return res.data;
});

export const fetchPermissionTemplates = createAsyncThunk("admin/fetchPermissionTemplates", async () => {
  const res = await adminService.getPermissionTemplates();
  return res.data.permissionTemplates;
});

export const upsertPermissionTemplate = createAsyncThunk("admin/upsertPermissionTemplate", async (data) => {
  const res = await adminService.upsertPermissionTemplate(data);
  return res.data.permissionTemplate;
});

export const deletePermissionTemplate = createAsyncThunk("admin/deletePermissionTemplate", async (id) => {
  await adminService.deletePermissionTemplate(id);
  return id;
});

export const applyDepartmentPermission = createAsyncThunk("admin/applyDepartmentPermission", async (data) => {
  const res = await adminService.applyDepartmentPermission(data);
  return res.data;
});

export const applyRolePermission = createAsyncThunk("admin/applyRolePermission", async (data) => {
  const res = await adminService.applyRolePermission(data);
  return res.data;
});

export const fetchWidgets = createAsyncThunk("admin/fetchWidgets", async () => {
  const res = await adminService.getWidgets();
  return res.data.widgets;
});

export const createWidget = createAsyncThunk("admin/createWidget", async (data) => {
  const res = await adminService.createWidget(data);
  return res.data.widget;
});

export const updateWidget = createAsyncThunk("admin/updateWidget", async ({ id, ...data }) => {
  const res = await adminService.updateWidget(id, data);
  return res.data.widget;
});

export const deleteWidget = createAsyncThunk("admin/deleteWidget", async (id) => {
  await adminService.deleteWidget(id);
  return id;
});

export const fetchDashboards = createAsyncThunk("admin/fetchDashboards", async () => {
  const res = await adminService.getDashboards();
  return res.data.dashboards;
});

export const fetchDashboardLayout = createAsyncThunk("admin/fetchDashboardLayout", async (slug) => {
  const res = await adminService.getDashboardLayout(slug);
  return res.data.layout;
});

export const saveDashboardLayout = createAsyncThunk("admin/saveDashboardLayout", async ({ slug, layout }) => {
  const res = await adminService.updateDashboardLayout(slug, layout);
  return res.data.layout;
});

export const fetchStats = createAsyncThunk("admin/fetchStats", async () => {
  const res = await adminService.getStats();
  return res.data.stats;
});

export const fetchActivityLogs = createAsyncThunk("admin/fetchActivityLogs", async (params = {}) => {
  const res = await adminService.getActivityLogs(params);
  return res.data;
});

export const fetchUserStats = createAsyncThunk("admin/fetchUserStats", async (userId) => {
  const res = await adminService.getUserStats(userId);
  return res.data.userStats;
});

export const fetchActiveUsers = createAsyncThunk("admin/fetchActiveUsers", async () => {
  const res = await adminService.getActiveUsers();
  return res.data.users;
});

export const forceLogoutUser = createAsyncThunk("admin/forceLogoutUser", async (id) => {
  await adminService.forceLogoutUser(id);
  return id;
});

export const bulkDeleteUsers = createAsyncThunk("admin/bulkDeleteUsers", async (userIds) => {
  await adminService.bulkDeleteUsers(userIds);
  return userIds;
});

export const bulkSuspendUsers = createAsyncThunk("admin/bulkSuspendUsers", async ({ userIds, suspended }) => {
  await adminService.bulkSuspendUsers(userIds, suspended);
  return { userIds: new Set(userIds), suspended };
});

export const cloneRole = createAsyncThunk("admin/cloneRole", async ({ id, ...data }) => {
  const res = await adminService.cloneRole(id, data.name);
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
    activeUsers: [],
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
      .addCase(fetchActiveUsers.fulfilled, (state, action) => { state.activeUsers = action.payload; })
      .addCase(forceLogoutUser.fulfilled, (state, action) => {
        state.activeUsers = state.activeUsers.filter((u) => u.id !== action.payload);
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
