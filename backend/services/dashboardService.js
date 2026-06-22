const { readDB } = require("../utils/dbHelper");
const { getUserById } = require("./userService");

function resolveGranted(db, userId, userRoleId, userDeptIds, targetType, targetId, defaultVal) {
  const userPerms = (db.permissions || []).filter(
    (p) => p.userId === userId && p.targetType === targetType && p.targetId === targetId
  );
  if (userPerms.length > 0) return { source: "user", granted: userPerms[0].granted };

  const roleTemplates = (db.permissionTemplates || []).filter(
    (t) => t.assigneeType === "role" && t.assigneeId === userRoleId && t.targetType === targetType && t.targetId === targetId
  );
  if (roleTemplates.length > 0) return { source: "role", granted: roleTemplates[0].granted };

  for (const deptId of userDeptIds) {
    const deptTemplates = (db.permissionTemplates || []).filter(
      (t) => t.assigneeType === "department" && t.assigneeId === deptId && t.targetType === targetType && t.targetId === targetId
    );
    if (deptTemplates.length > 0) return { source: "department", granted: deptTemplates[0].granted };
  }

  return { source: "default", granted: defaultVal };
}

async function getDashboardData(userId) {
  const db = await readDB();

  const user = getUserById(db, userId);
  const userRoleId = user ? user.roleId : null;
  const userAssignments = (db.userAssignments || []).filter((a) => a.userId === userId);
  const userDeptIds = userAssignments.map((a) => a.departmentId);

  const allDepts = db.departments || [];
  const allowedDeptIds = new Set();

  for (const d of allDepts) {
    const isAssigned = userDeptIds.includes(d.id);
    const result = resolveGranted(db, userId, userRoleId, userDeptIds, "department", d.id, isAssigned);
    if (result.granted) allowedDeptIds.add(d.id);
  }

  const departments = allDepts.filter((d) => allowedDeptIds.has(d.id));
  const roles = db.roles || [];
  const allWidgets = db.widgets || [];

  const allowedWidgetIds = new Set();
  for (const w of allWidgets) {
    const result = resolveGranted(db, userId, userRoleId, userDeptIds, "widget", w.id, w.defaultEnabled);
    if (result.granted) allowedWidgetIds.add(w.id);
  }

  const widgets = allWidgets.filter((w) => allowedWidgetIds.has(w.id));

  const departmentsWithRoles = departments.map((d) => {
    const deptRoles = roles.filter((r) => r.departmentId === d.id);
    const userRole = userAssignments
      .filter((a) => a.departmentId === d.id)
      .map((a) => roles.find((r) => r.id === a.roleId))
      .filter(Boolean);
    return { ...d, roles: deptRoles, userRole: userRole[0] || null };
  });

  return { departments: departmentsWithRoles, widgets };
}

async function getAllowedDashboards(userId) {
  const db = await readDB();
  const allDashboards = db.dashboards || [];

  const userDashboardPerms = (db.permissions || []).filter(
    (p) => p.userId === userId && p.targetType === "dashboard"
  );
  const allowedDashboardIds = new Set(
    userDashboardPerms.filter((p) => p.granted).map((p) => p.targetId)
  );
  const allowed = allDashboards.filter((d) => allowedDashboardIds.has(d.id));

  return { dashboards: allowed };
}

async function getSectionPermissions(userId) {
  const db = await readDB();

  const user = getUserById(db, userId);
  const userRoleId = user ? user.roleId : null;
  const userAssignments = (db.userAssignments || []).filter((a) => a.userId === userId);
  const userDeptIds = userAssignments.map((a) => a.departmentId);

  const sectionPerms = (db.permissions || []).filter(
    (p) => p.userId === userId && p.targetType === "dashboard-section"
  );

  const roleSectionTemplates = (db.permissionTemplates || []).filter(
    (t) => t.assigneeType === "role" && t.assigneeId === userRoleId && t.targetType === "dashboard-section"
  );

  const deptSectionTemplates = (db.permissionTemplates || []).filter(
    (t) => t.assigneeType === "department" && userDeptIds.includes(t.assigneeId) && t.targetType === "dashboard-section"
  );

  const aggregated = {};
  for (const p of sectionPerms) {
    aggregated[p.targetId] = p.granted;
  }
  for (const t of roleSectionTemplates) {
    if (!(t.targetId in aggregated)) aggregated[t.targetId] = t.granted;
  }
  for (const t of deptSectionTemplates) {
    if (!(t.targetId in aggregated)) aggregated[t.targetId] = t.granted;
  }

  const permissions = Object.entries(aggregated).map(([targetId, granted]) => ({
    targetType: "dashboard-section",
    targetId,
    granted,
  }));

  return { permissions };
}

module.exports = { resolveGranted, getDashboardData, getAllowedDashboards, getSectionPermissions };
