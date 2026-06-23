const adminService = require("../services/adminService");

// ─── Users ─────────────────────────────────────────────────

async function getUsers(req, res, next) {
  try {
    const result = await adminService.getUsers();
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const result = await adminService.createUser(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const result = await adminService.updateUser(req.params.id, req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const result = await adminService.deleteUser(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function bulkCreateUsers(req, res, next) {
  try {
    const result = await adminService.bulkCreateUsers(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

// ─── Departments ────────────────────────────────────────────

async function getDepartments(req, res, next) {
  try {
    const result = await adminService.getDepartments();
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function createDepartment(req, res, next) {
  try {
    const result = await adminService.createDepartment(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function updateDepartment(req, res, next) {
  try {
    const result = await adminService.updateDepartment(req.params.id, req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteDepartment(req, res, next) {
  try {
    const result = await adminService.deleteDepartment(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Roles ──────────────────────────────────────────────────

async function getRoles(req, res, next) {
  try {
    const result = await adminService.getRoles(req.query.departmentId);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function createRole(req, res, next) {
  try {
    const result = await adminService.createRole(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function updateRole(req, res, next) {
  try {
    const result = await adminService.updateRole(req.params.id, req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteRole(req, res, next) {
  try {
    const result = await adminService.deleteRole(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── User-Department-Role Assignments ───────────────────────

async function getAssignments(req, res, next) {
  try {
    const result = await adminService.getAssignments();
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function createAssignment(req, res, next) {
  try {
    const result = await adminService.createAssignment(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function updateAssignment(req, res, next) {
  try {
    const result = await adminService.updateAssignment(req.params.id, req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteAssignment(req, res, next) {
  try {
    const result = await adminService.deleteAssignment(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Permissions ────────────────────────────────────────────

async function getPermissions(req, res, next) {
  try {
    const result = await adminService.getPermissions(req.query.userId);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function createPermission(req, res, next) {
  try {
    const result = await adminService.createPermission(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function deletePermission(req, res, next) {
  try {
    const result = await adminService.deletePermission(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Bulk Permissions ─────────────────────────────────────────

async function bulkCreatePermissions(req, res, next) {
  try {
    const result = await adminService.bulkCreatePermissions(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function bulkSavePermissions(req, res, next) {
  try {
    const result = await adminService.bulkSavePermissions(req.body); 
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

// ─── Permission Templates ─────────────────────────────────────

async function getPermissionTemplates(req, res, next) {
  try {
    const result = await adminService.getPermissionTemplates(req.query.assigneeType, req.query.assigneeId);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function upsertPermissionTemplate(req, res, next) {
  try {
    const result = await adminService.upsertPermissionTemplate(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function deletePermissionTemplate(req, res, next) {
  try {
    const result = await adminService.deletePermissionTemplate(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Apply Permissions ──────────────────────────────────────

async function applyDepartmentPermission(req, res, next) {
  try {
    const result = await adminService.applyDepartmentPermission(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function applyRolePermission(req, res, next) {
  try {
    const result = await adminService.applyRolePermission(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Widgets ────────────────────────────────────────────────

async function getWidgets(req, res, next) {
  try {
    const result = await adminService.getWidgets();
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function createWidget(req, res, next) {
  try {
    const result = await adminService.createWidget(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

async function updateWidget(req, res, next) {
  try {
    const result = await adminService.updateWidget(req.params.id, req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteWidget(req, res, next) {
  try {
    const result = await adminService.deleteWidget(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Dashboards ─────────────────────────────────────────────

async function getDashboards(req, res, next) {
  try {
    const result = await adminService.getDashboards();
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Dashboard Layouts ──────────────────────────────────────

async function getDashboardLayout(req, res, next) {
  try {
    const result = await adminService.getDashboardLayout(req.params.slug);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateDashboardLayout(req, res, next) {
  try {
    const result = await adminService.updateDashboardLayout(req.params.slug, req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Stats & Activity Logs ──────────────────────────────────

async function getStats(req, res, next) {
  try {
    const result = await adminService.getStats();
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function getActivityLogs(req, res, next) {
  try {
    const result = await adminService.getActivityLogs(req.query);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function getUserStats(req, res, next) {
  try {
    const result = await adminService.getUserStats(req.params.userId);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Active User Management ─────────────────────────────

async function getActiveUsers(req, res, next) {
  try {
    const result = await adminService.getActiveUsers();
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function forceLogoutUser(req, res, next) {
  try {
    const result = await adminService.forceLogoutUser(req.params.id);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Bulk User Actions ────────────────────────────────────

async function bulkDeleteUsers(req, res, next) {
  try {
    const result = await adminService.bulkDeleteUsers(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

async function bulkSuspendUsers(req, res, next) {
  try {
    const result = await adminService.bulkSuspendUsers(req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Role Clone ───────────────────────────────────────────

async function cloneRole(req, res, next) {
  try {
    const result = await adminService.cloneRole(req.params.id, req.body);
    if (result.error) return res.status(result.statusCode).json({ success: false, message: result.error });
    res.status(result.statusCode || 201).json(result);
  } catch (err) { next(err); }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkCreateUsers,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getPermissions,
  createPermission,
  deletePermission,
  bulkCreatePermissions,
  bulkSavePermissions,
  getPermissionTemplates,
  upsertPermissionTemplate,
  deletePermissionTemplate,
  applyDepartmentPermission,
  applyRolePermission,
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  getDashboards,
  getDashboardLayout,
  updateDashboardLayout,
  getStats,
  getActivityLogs,
  getUserStats,
  getActiveUsers,
  forceLogoutUser,
  bulkDeleteUsers,
  bulkSuspendUsers,
  cloneRole,
};
