const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../utils/dbHelper");
const { hashPassword } = require("../utils/cryptoHelper");
const {
  emitPermissionUpdate,
  emitBulkPermissionUpdate,
  emitLayoutUpdate,
  forceDisconnectUser,
  getActiveUserIds,
} = require("../utils/websocket");
const { sendForceLogoutEmail } = require("./emailService");

// ─── Users ─────────────────────────────────────────────────

async function getUsers() {
  const db = await readDB();
  const assignments = db.userAssignments || [];
  const roles = db.roles || [];
  const departments = db.departments || [];
  const users = db.users
    .filter((u) => u.role !== "admin")
    .map((u) => {
      const userAssignments = assignments.filter((a) => a.userId === u.id);
      const assignedRole = roles.find((r) => r.id === u.roleId);
      const assignment = userAssignments[0];
      const assignedDept = assignment
        ? departments.find((d) => d.id === assignment.departmentId)
        : null;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || "user",
        roleId: u.roleId || null,
        roleName: assignedRole?.name || null,
        departmentId: assignedDept?.id || null,
        departmentName: assignedDept?.name || null,
        status: u.status,
        createdAt: u.createdAt,
        suspended: u.suspended || false,
        assignments: userAssignments,
      };
    });
  return { success: true, users };
}

async function createUser({ name, email, password, role, roleId }) {
  const db = await readDB();

  if (db.users.find((u) => u.email === email)) {
    return { error: "Email already in use.", statusCode: 400 };
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    role: role || "user",
    roleId: roleId || null,
    status: "VERIFIED",
    twoFactorSecretEncrypted: null,
    failedAttempts: 0,
    lockUntil: null,
    createdAt: new Date().toISOString(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    lastActivityAt: null,
    pendingDeleteAt: null,
    deleteToken: null,
    suspended: false,
  };

  db.users.push(newUser);
  await writeDB(db);

  return {
    statusCode: 201,
    success: true,
    message: "User created successfully.",
    user: { id: newUser.id, name, email, role: newUser.role, roleId: newUser.roleId },
  };
}

async function updateUser(id, { name, email, role, roleId }) {
  const db = await readDB();

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return { error: "User not found.", statusCode: 404 };
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (roleId !== undefined) user.roleId = roleId;

  await writeDB(db);

  try { emitPermissionUpdate(id, { type: "user", user: { name: user.name, email: user.email, role: user.role, roleId: user.roleId } }); } catch (_) {}

  return { success: true, message: "User updated." };
}

async function deleteUser(id) {
  const db = await readDB();

  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return { error: "User not found.", statusCode: 404 };
  }

  db.users.splice(idx, 1);
  db.userAssignments = (db.userAssignments || []).filter((a) => a.userId !== id);
  db.permissions = (db.permissions || []).filter((p) => p.userId !== id);

  await writeDB(db);
  return { success: true, message: "User deleted." };
}

// ─── Departments ────────────────────────────────────────────

async function getDepartments() {
  const db = await readDB();
  return { success: true, departments: db.departments || [] };
}

async function createDepartment({ name, description }) {
  const db = await readDB();

  const dept = {
    id: uuidv4(),
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  db.departments.push(dept);
  await writeDB(db);

  return { statusCode: 201, success: true, department: dept };
}

async function updateDepartment(id, { name, description }) {
  const db = await readDB();

  const dept = db.departments.find((d) => d.id === id);
  if (!dept) {
    return { error: "Department not found.", statusCode: 404 };
  }

  if (name !== undefined) dept.name = name;
  if (description !== undefined) dept.description = description;

  await writeDB(db);
  return { success: true, department: dept };
}

async function deleteDepartment(id) {
  const db = await readDB();

  const idx = db.departments.findIndex((d) => d.id === id);
  if (idx === -1) {
    return { error: "Department not found.", statusCode: 404 };
  }

  db.departments.splice(idx, 1);
  db.roles = (db.roles || []).filter((r) => r.departmentId !== id);
  db.userAssignments = (db.userAssignments || []).filter((a) => a.departmentId !== id);
  db.permissions = (db.permissions || []).filter(
    (p) => !(p.targetType === "department" && p.targetId === id)
  );

  await writeDB(db);
  return { success: true, message: "Department deleted." };
}

// ─── Roles ──────────────────────────────────────────────────

async function getRoles(departmentId) {
  const db = await readDB();
  let roles = db.roles || [];
  if (departmentId) {
    roles = roles.filter((r) => r.departmentId === departmentId);
  }
  return { success: true, roles };
}

async function createRole({ name, departmentId }) {
  const db = await readDB();

  const role = {
    id: uuidv4(),
    name,
    departmentId,
    createdAt: new Date().toISOString(),
  };

  db.roles.push(role);
  await writeDB(db);

  return { statusCode: 201, success: true, role };
}

async function updateRole(id, { name }) {
  const db = await readDB();

  const role = db.roles.find((r) => r.id === id);
  if (!role) {
    return { error: "Role not found.", statusCode: 404 };
  }

  if (name !== undefined) role.name = name;
  await writeDB(db);
  return { success: true, role };
}

async function deleteRole(id) {
  const db = await readDB();

  const idx = db.roles.findIndex((r) => r.id === id);
  if (idx === -1) {
    return { error: "Role not found.", statusCode: 404 };
  }

  db.roles.splice(idx, 1);
  db.userAssignments = (db.userAssignments || []).filter((a) => a.roleId !== id);

  await writeDB(db);
  return { success: true, message: "Role deleted." };
}

// ─── User-Department-Role Assignments ───────────────────────

async function getAssignments() {
  const db = await readDB();
  return { success: true, assignments: db.userAssignments || [] };
}

async function createAssignment({ userId, departmentId, roleId }) {
  const db = await readDB();

  const assignment = {
    id: uuidv4(),
    userId,
    departmentId,
    roleId,
    createdAt: new Date().toISOString(),
  };

  db.userAssignments.push(assignment);
  await writeDB(db);

  try { emitPermissionUpdate(userId, { type: "assignment", action: "created", departmentId, roleId }); } catch (_) {}

  return { statusCode: 201, success: true, assignment };
}

async function updateAssignment(id, { departmentId, roleId }) {
  const db = await readDB();

  const assignment = db.userAssignments.find((a) => a.id === id);
  if (!assignment) {
    return { error: "Assignment not found.", statusCode: 404 };
  }

  if (departmentId !== undefined) assignment.departmentId = departmentId;
  if (roleId !== undefined) assignment.roleId = roleId;

  await writeDB(db);

  try { emitPermissionUpdate(assignment.userId, { type: "assignment", action: "updated", departmentId: assignment.departmentId, roleId: assignment.roleId }); } catch (_) {}

  return { success: true, assignment };
}

async function deleteAssignment(id) {
  const db = await readDB();

  const idx = db.userAssignments.findIndex((a) => a.id === id);
  if (idx === -1) {
    return { error: "Assignment not found.", statusCode: 404 };
  }

  const assignment = db.userAssignments[idx];
  db.userAssignments.splice(idx, 1);
  await writeDB(db);

  try { emitPermissionUpdate(assignment.userId, { type: "assignment", action: "deleted" }); } catch (_) {}

  return { success: true, message: "Assignment removed." };
}

// ─── Permissions ────────────────────────────────────────────

async function getPermissions(userId) {
  const db = await readDB();
  let permissions = db.permissions || [];
  if (userId) {
    permissions = permissions.filter((p) => p.userId === userId);
  }
  return { success: true, permissions };
}

async function createPermission({ userId, targetType, targetId, granted }) {
  const db = await readDB();

  const existingIdx = (db.permissions || []).findIndex(
    (p) => p.userId === userId && p.targetType === targetType && p.targetId === targetId
  );

  let permission;
  if (existingIdx >= 0) {
    db.permissions[existingIdx].granted = granted;
    db.permissions[existingIdx].updatedAt = new Date().toISOString();
    permission = db.permissions[existingIdx];
  } else {
    permission = {
      id: uuidv4(),
      userId,
      targetType,
      targetId,
      granted,
      updatedAt: new Date().toISOString(),
    };
    db.permissions.push(permission);
  }

  await writeDB(db);

  const path = targetType === "dashboard" ? (db.dashboards || []).find(d => d.id === targetId)?.path : undefined;
  try { emitPermissionUpdate(userId, { type: "permission", action: "upsert", targetType, targetId, granted, ...(path && { path }) }); } catch (_) {}

  return { statusCode: 201, success: true, permission };
}

async function deletePermission(id) {
  const db = await readDB();

  const idx = db.permissions.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { error: "Permission not found.", statusCode: 404 };
  }

  const perm = db.permissions[idx];
  db.permissions.splice(idx, 1);
  await writeDB(db);

  const path = perm.targetType === "dashboard" ? (db.dashboards || []).find(d => d.id === perm.targetId)?.path : undefined;
  try { emitPermissionUpdate(perm.userId, { type: "permission", action: "delete", targetType: perm.targetType, targetId: perm.targetId, ...(path && { path }) }); } catch (_) {}

  return { success: true, message: "Permission removed." };
}

// ─── Bulk Permissions ─────────────────────────────────────────

async function bulkCreatePermissions({ userIds, targetType, targetId, granted }) {
  const db = await readDB();

  const results = [];
  for (const userId of userIds) {
    const existingIdx = (db.permissions || []).findIndex(
      (p) => p.userId === userId && p.targetType === targetType && p.targetId === targetId
    );

    let permission;
    if (existingIdx >= 0) {
      db.permissions[existingIdx].granted = granted;
      db.permissions[existingIdx].updatedAt = new Date().toISOString();
      permission = db.permissions[existingIdx];
    } else {
      permission = {
        id: uuidv4(),
        userId,
        targetType,
        targetId,
        granted,
        updatedAt: new Date().toISOString(),
      };
      db.permissions.push(permission);
    }
    results.push(permission);
  }

  await writeDB(db);

  const path = targetType === "dashboard" ? (db.dashboards || []).find(d => d.id === targetId)?.path : undefined;
  try { emitBulkPermissionUpdate(userIds, { type: "permission", action: "upsert", targetType, targetId, granted, ...(path && { path }) }); } catch (_) {}

  return { statusCode: 201, success: true, count: results.length };
}

// ─── Bulk Save Permissions ─────────────────────────────────────

async function bulkSavePermissions({ userIds, permissions }) {
  const db = await readDB();

  const results = [];
  for (const perm of permissions) {
    for (const userId of userIds) {
      const existingIdx = (db.permissions || []).findIndex(
        (p) => p.userId === userId && p.targetType === perm.targetType && p.targetId === perm.targetId
      );
      let permission;
      if (existingIdx >= 0) {
        db.permissions[existingIdx].granted = perm.granted;
        db.permissions[existingIdx].updatedAt = new Date().toISOString();
        permission = db.permissions[existingIdx];
      } else {
        permission = {
          id: uuidv4(),
          userId,
          targetType: perm.targetType,
          targetId: perm.targetId,
          granted: perm.granted,
          updatedAt: new Date().toISOString(),
        };
        db.permissions.push(permission);
      }
      results.push(permission);
    }
  }

  await writeDB(db);

  try { emitBulkPermissionUpdate(userIds, { type: "permission", action: "bulk-save" }); } catch (_) {}

  return { statusCode: 201, success: true, count: results.length };
}

// ─── Permission Templates ─────────────────────────────────────

async function getPermissionTemplates(assigneeType, assigneeId) {
  const db = await readDB();
  let templates = db.permissionTemplates || [];
  if (assigneeType) {
    templates = templates.filter((t) => t.assigneeType === assigneeType);
  }
  if (assigneeId) {
    templates = templates.filter((t) => t.assigneeId === assigneeId);
  }
  return { success: true, permissionTemplates: templates };
}

async function upsertPermissionTemplate({ assigneeType, assigneeId, targetType, targetId, granted }) {
  const db = await readDB();

  const existingIdx = (db.permissionTemplates || []).findIndex(
    (t) => t.assigneeType === assigneeType && t.assigneeId === assigneeId && t.targetType === targetType && t.targetId === targetId
  );

  let template;
  if (existingIdx >= 0) {
    db.permissionTemplates[existingIdx].granted = granted;
    db.permissionTemplates[existingIdx].updatedAt = new Date().toISOString();
    template = db.permissionTemplates[existingIdx];
  } else {
    template = {
      id: uuidv4(),
      assigneeType,
      assigneeId,
      targetType,
      targetId,
      granted,
      updatedAt: new Date().toISOString(),
    };
    if (!db.permissionTemplates) db.permissionTemplates = [];
    db.permissionTemplates.push(template);
  }

  await writeDB(db);

  let affectedIds = [];
  if (assigneeType === "role") {
    affectedIds = (db.userAssignments || []).filter((a) => a.roleId === assigneeId).map((a) => a.userId);
  } else if (assigneeType === "department") {
    affectedIds = (db.userAssignments || []).filter((a) => a.departmentId === assigneeId).map((a) => a.userId);
  }
  if (affectedIds.length > 0) {
    const path = targetType === "dashboard" ? (db.dashboards || []).find(d => d.id === targetId)?.path : undefined;
    try { emitBulkPermissionUpdate([...new Set(affectedIds)], { type: "template", action: "upsert", assigneeType, assigneeId, targetType, targetId, granted, ...(path && { path }) }); } catch (_) {}
  }

  return { statusCode: 201, success: true, permissionTemplate: template };
}

async function deletePermissionTemplate(id) {
  const db = await readDB();

  const idx = (db.permissionTemplates || []).findIndex((t) => t.id === id);
  if (idx === -1) {
    return { error: "Permission template not found.", statusCode: 404 };
  }

  db.permissionTemplates.splice(idx, 1);
  await writeDB(db);

  return { success: true, message: "Permission template removed." };
}

// ─── Apply Permissions ──────────────────────────────────────

async function applyDepartmentPermission({ departmentId, targetType, targetId, granted, applyTo }) {
  const db = await readDB();

  const deptExisting = (db.permissionTemplates || []).findIndex(
    (t) => t.assigneeType === "department" && t.assigneeId === departmentId && t.targetType === targetType && t.targetId === targetId
  );
  if (deptExisting >= 0) {
    db.permissionTemplates[deptExisting].granted = granted;
    db.permissionTemplates[deptExisting].updatedAt = new Date().toISOString();
  } else {
    if (!db.permissionTemplates) db.permissionTemplates = [];
    db.permissionTemplates.push({
      id: uuidv4(),
      assigneeType: "department",
      assigneeId: departmentId,
      targetType,
      targetId,
      granted,
      updatedAt: new Date().toISOString(),
    });
  }

  const allAffected = new Set();

  if (applyTo === "all") {
    const deptRoles = (db.roles || []).filter((r) => r.departmentId === departmentId);
    for (const role of deptRoles) {
      const roleExisting = (db.permissionTemplates || []).findIndex(
        (t) => t.assigneeType === "role" && t.assigneeId === role.id && t.targetType === targetType && t.targetId === targetId
      );
      if (roleExisting >= 0) {
        db.permissionTemplates[roleExisting].granted = granted;
        db.permissionTemplates[roleExisting].updatedAt = new Date().toISOString();
      } else {
        if (!db.permissionTemplates) db.permissionTemplates = [];
        db.permissionTemplates.push({
          id: uuidv4(),
          assigneeType: "role",
          assigneeId: role.id,
          targetType,
          targetId,
          granted,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const deptUsers = (db.userAssignments || []).filter((a) => a.departmentId === departmentId);
    for (const assgn of deptUsers) {
      allAffected.add(assgn.userId);
      const userExisting = (db.permissions || []).findIndex(
        (p) => p.userId === assgn.userId && p.targetType === targetType && p.targetId === targetId
      );
      if (userExisting >= 0) {
        db.permissions[userExisting].granted = granted;
        db.permissions[userExisting].updatedAt = new Date().toISOString();
      } else {
        if (!db.permissions) db.permissions = [];
        db.permissions.push({
          id: uuidv4(),
          userId: assgn.userId,
          targetType,
          targetId,
          granted,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } else {
    const deptUsers = (db.userAssignments || []).filter((a) => a.departmentId === departmentId);
    for (const assgn of deptUsers) {
      allAffected.add(assgn.userId);
    }
  }

  await writeDB(db);

  if (allAffected.size > 0) {
    const path = targetType === "dashboard" ? (db.dashboards || []).find(d => d.id === targetId)?.path : undefined;
    try { emitBulkPermissionUpdate([...allAffected], { type: "template", action: applyTo === "all" ? "applied-all" : "applied-future", assigneeType: "department", assigneeId: departmentId, targetType, targetId, granted, ...(path && { path }) }); } catch (_) {}
  }

  return { success: true, message: `Department permission ${applyTo === "all" ? "applied to all" : "set for future"}.` };
}

async function applyRolePermission({ roleId, targetType, targetId, granted, applyTo }) {
  const db = await readDB();

  const roleExisting = (db.permissionTemplates || []).findIndex(
    (t) => t.assigneeType === "role" && t.assigneeId === roleId && t.targetType === targetType && t.targetId === targetId
  );
  if (roleExisting >= 0) {
    db.permissionTemplates[roleExisting].granted = granted;
    db.permissionTemplates[roleExisting].updatedAt = new Date().toISOString();
  } else {
    if (!db.permissionTemplates) db.permissionTemplates = [];
    db.permissionTemplates.push({
      id: uuidv4(),
      assigneeType: "role",
      assigneeId: roleId,
      targetType,
      targetId,
      granted,
      updatedAt: new Date().toISOString(),
    });
  }

  const allAffected = new Set();

  if (applyTo === "all") {
    const roleUsers = (db.userAssignments || []).filter((a) => a.roleId === roleId);
    for (const assgn of roleUsers) {
      allAffected.add(assgn.userId);
      const userExisting = (db.permissions || []).findIndex(
        (p) => p.userId === assgn.userId && p.targetType === targetType && p.targetId === targetId
      );
      if (userExisting >= 0) {
        db.permissions[userExisting].granted = granted;
        db.permissions[userExisting].updatedAt = new Date().toISOString();
      } else {
        if (!db.permissions) db.permissions = [];
        db.permissions.push({
          id: uuidv4(),
          userId: assgn.userId,
          targetType,
          targetId,
          granted,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } else {
    const roleUsers = (db.userAssignments || []).filter((a) => a.roleId === roleId);
    for (const assgn of roleUsers) {
      allAffected.add(assgn.userId);
    }
  }

  await writeDB(db);

  if (allAffected.size > 0) {
    const path = targetType === "dashboard" ? (db.dashboards || []).find(d => d.id === targetId)?.path : undefined;
    try { emitBulkPermissionUpdate([...allAffected], { type: "template", action: applyTo === "all" ? "applied-all" : "applied-future", assigneeType: "role", assigneeId: roleId, targetType, targetId, granted, ...(path && { path }) }); } catch (_) {}
  }

  return { success: true, message: `Role permission ${applyTo === "all" ? "applied to all" : "set for future"}.` };
}

// ─── Widgets ────────────────────────────────────────────────

async function getWidgets() {
  const db = await readDB();
  return { success: true, widgets: db.widgets || [] };
}

async function createWidget({ name, componentName, description }) {
  const db = await readDB();

  if ((db.widgets || []).find((w) => w.componentName === componentName)) {
    return { error: "Widget with this component already exists.", statusCode: 400 };
  }

  const widget = {
    id: uuidv4(),
    name,
    componentName,
    description: description || "",
    defaultEnabled: true,
    createdAt: new Date().toISOString(),
  };

  db.widgets.push(widget);
  await writeDB(db);

  return { statusCode: 201, success: true, widget };
}

async function updateWidget(id, { name, componentName, description }) {
  const db = await readDB();

  const widget = db.widgets.find((w) => w.id === id);
  if (!widget) {
    return { error: "Widget not found.", statusCode: 404 };
  }

  if (name !== undefined) widget.name = name;
  if (componentName !== undefined) widget.componentName = componentName;
  if (description !== undefined) widget.description = description;

  await writeDB(db);
  return { success: true, widget };
}

async function deleteWidget(id) {
  const db = await readDB();

  const idx = db.widgets.findIndex((w) => w.id === id);
  if (idx === -1) {
    return { error: "Widget not found.", statusCode: 404 };
  }

  db.widgets.splice(idx, 1);
  db.permissions = (db.permissions || []).filter(
    (p) => !(p.targetType === "widget" && p.targetId === id)
  );

  await writeDB(db);
  return { success: true, message: "Widget deleted." };
}

// ─── Dashboards ─────────────────────────────────────────────

async function getDashboards() {
  const db = await readDB();
  return { success: true, dashboards: db.dashboards || [] };
}

// ─── Dashboard Layouts ──────────────────────────────────────

async function getDashboardLayout(slug) {
  const db = await readDB();
  const layouts = db.dashboardLayouts || [];
  const layout = layouts.find((l) => l.slug === slug);
  if (layout) {
    return { success: true, layout };
  }
  return {
    success: true,
    layout: {
      slug,
      sectionOrder: ["kpiCards", "charts", "tables"],
      kpiCardsOrder: [],
      chartsOrder: [],
      tablesOrder: [],
    },
  };
}

async function updateDashboardLayout(slug, { sectionOrder, kpiCardsOrder, chartsOrder, tablesOrder }) {
  const db = await readDB();
  if (!db.dashboardLayouts) db.dashboardLayouts = [];
  const idx = db.dashboardLayouts.findIndex((l) => l.slug === slug);
  const layout = { slug, sectionOrder, kpiCardsOrder, chartsOrder, tablesOrder };
  if (idx >= 0) db.dashboardLayouts[idx] = layout;
  else db.dashboardLayouts.push(layout);
  await writeDB(db);
  emitLayoutUpdate(slug);
  return { success: true, layout };
}

// ─── Stats & Activity Logs ──────────────────────────────────

async function getStats() {
  const db = await readDB();
  const adminIds = new Set(db.users.filter((u) => u.role === "admin").map((u) => u.id));
  const logs = (db.activityLogs || []).filter((l) => !adminIds.has(l.userId));

  const totalUsers = db.users.filter((u) => !adminIds.has(u.id)).length;
  const totalSessions = logs.filter((l) => l.type === "session_start").length;
  const totalEvents = logs.filter((l) => l.type === "event").length;

  const sessionLogs = logs
    .filter((l) => l.type === "session_start" || l.type === "session_end")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const userSessionMap = new Map();
  for (const l of sessionLogs) {
    if (!userSessionMap.has(l.userId)) userSessionMap.set(l.userId, []);
    userSessionMap.get(l.userId).push(l);
  }

  let totalTimeSpentMs = 0;
  const activeUserSet = new Set();

  for (const [uid, sessions] of userSessionMap) {
    let hasActive = false;
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].type === "session_start") {
        const start = sessions[i];
        const end = sessions.slice(i + 1).find(
          (s) => s.type === "session_end" && s.metadata?.sessionId === start.metadata?.sessionId
        );

        if (end) {
          totalTimeSpentMs += new Date(end.timestamp) - new Date(start.timestamp);
        } else {
          const nextStart = sessions.slice(i + 1).find((s) => s.type === "session_start");
          if (nextStart) {
            totalTimeSpentMs += new Date(nextStart.timestamp) - new Date(start.timestamp);
          } else {
            hasActive = true;
          }
        }
      }
    }
    if (hasActive) activeUserSet.add(uid);
  }

  const activeUsers = activeUserSet.size;

  return {
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      totalSessions,
      totalEvents,
      totalTimeSpentMs,
    },
  };
}

async function getActivityLogs({ userId, type, page = 1, limit = 50 }) {
  const db = await readDB();

  let logs = db.activityLogs || [];

  if (userId) logs = logs.filter((l) => l.userId === userId);
  if (type) logs = logs.filter((l) => l.type === type);

  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = logs.length;
  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);
  const paged = logs.slice((p - 1) * l, p * l);

  return { success: true, logs: paged, total, page: p, limit: l };
}

async function getUserStats(userId) {
  const db = await readDB();
  const logs = (db.activityLogs || []).filter((l) => l.userId === userId);

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return { error: "User not found.", statusCode: 404 };
  }

  const totalSessions = logs.filter((l) => l.type === "session_start").length;
  const totalEvents = logs.filter((l) => l.type === "event").length;

  const sessions = logs
    .filter((l) => l.type === "session_start" || l.type === "session_end")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const sessionPairs = [];
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].type === "session_start") {
      const start = sessions[i];
      const end = sessions.slice(i + 1).find(
        (s) => s.type === "session_end" && s.metadata?.sessionId === start.metadata?.sessionId
      );

      if (!end) {
        const nextStart = sessions.slice(i + 1).find((s) => s.type === "session_start");
        if (nextStart) {
          sessionPairs.push({ start: start.timestamp, end: nextStart.timestamp });
        } else {
          sessionPairs.push({ start: start.timestamp, end: null });
        }
      } else {
        sessionPairs.push({ start: start.timestamp, end: end.timestamp });
      }
    }
  }

  const totalTimeSpentMs = sessionPairs.reduce((sum, s) => {
    if (s.end) return sum + (new Date(s.end) - new Date(s.start));
    return sum;
  }, 0);

  return {
    success: true,
    userStats: {
      name: user.name,
      email: user.email,
      totalSessions,
      totalEvents,
      totalTimeSpentMs,
      sessions: sessionPairs,
    },
  };
}

// ─── Bulk Create Users ──────────────────────────────────────

async function bulkCreateUsers({ users }) {
  if (!Array.isArray(users) || users.length === 0) {
    return { error: "No users provided.", statusCode: 400 };
  }

  const db = await readDB();
  const departments = db.departments || [];
  const roles = db.roles || [];
  const created = [];
  const errors = [];

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const row = i + 2;

    if (!u.name || !u.email || !u.password) {
      errors.push({ row, email: u.email || "", message: "Missing required fields (name, email, password)" });
      continue;
    }

    if (db.users.find((x) => x.email === u.email)) {
      errors.push({ row, email: u.email, message: "Email already exists" });
      continue;
    }

    const passwordHash = await hashPassword(u.password);
    const newUser = {
      id: uuidv4(),
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role || null,
      roleId: null,
      status: "VERIFIED",
      twoFactorSecretEncrypted: null,
      failedAttempts: 0,
      lockUntil: null,
      createdAt: new Date().toISOString(),
      resetPasswordToken: null,
      resetPasswordExpires: null,
      lastActivityAt: null,
      pendingDeleteAt: null,
      deleteToken: null,
      suspended: false,
    };

    db.users.push(newUser);
    created.push({ row, email: u.email, name: u.name });

    if (u.department) {
      let dept = departments.find((d) => d.name.toLowerCase() === u.department.toLowerCase().trim());
      if (!dept) {
        dept = {
          id: uuidv4(),
          name: u.department.trim(),
          description: "",
          createdAt: new Date().toISOString(),
        };
        departments.push(dept);
        db.departments = departments;
      }

      let matchedRole = null;
      if (u.role) {
        matchedRole = roles.find((r) => r.name.toLowerCase() === u.role.toLowerCase().trim() && r.departmentId === dept.id);
        if (!matchedRole) {
          matchedRole = {
            id: uuidv4(),
            name: u.role.trim(),
            departmentId: dept.id,
            createdAt: new Date().toISOString(),
          };
          roles.push(matchedRole);
          db.roles = roles;
        }
      }

      if (matchedRole) {
        newUser.roleId = matchedRole.id;
        newUser.role = matchedRole.name;
      }
      db.userAssignments.push({
        id: uuidv4(),
        userId: newUser.id,
        departmentId: dept.id,
        roleId: matchedRole ? matchedRole.id : null,
        createdAt: new Date().toISOString(),
      });
    } else if (u.role) {
      let role = roles.find((r) => r.name.toLowerCase() === u.role.toLowerCase().trim());
      if (!role) {
        role = {
          id: uuidv4(),
          name: u.role.trim(),
          departmentId: null,
          createdAt: new Date().toISOString(),
        };
        roles.push(role);
        db.roles = roles;
      }
      newUser.roleId = role.id;
      newUser.role = role.name;
    }
  }

  await writeDB(db);

  return {
    statusCode: created.length > 0 ? 201 : 400,
    success: created.length > 0,
    created: created.length,
    failed: errors.length,
    errors,
  };
}

// ─── Active User Management ─────────────────────────────

async function getActiveUsers() {
  const activeIds = new Set(getActiveUserIds());
  const db = await readDB();
  const now = Date.now();

  const active = db.users
    .filter((u) => u.role !== "admin" && u.status === "VERIFIED" && activeIds.has(u.id))
    .map((u) => {
      const lastActive = u.lastActivityAt ? new Date(u.lastActivityAt).getTime() : null;
      const sessionDuration = lastActive ? Math.floor((now - lastActive) / 1000) : 0;
      const hasInactivityWarning = !!u.pendingInactivityLogout;
      const warningExpiresAt = u.pendingInactivityLogout ? new Date(u.pendingInactivityLogout).getTime() : null;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || "user",
        lastActivityAt: u.lastActivityAt,
        sessionDurationSec: sessionDuration,
        hasInactivityWarning,
        warningExpiresAt,
        warningExpired: warningExpiresAt ? warningExpiresAt <= now : false,
      };
    });

  return { success: true, users: active };
}

async function forceLogoutUser(id) {
  const db = await readDB();

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return { error: "User not found.", statusCode: 404 };
  }

  user.adminForceLoggedOutAt = new Date().toISOString();
  await writeDB(db);

  try { forceDisconnectUser(id); } catch (_) {}

  sendForceLogoutEmail(user);

  return { success: true, message: "User logged out. Notification sent." };
}

// ─── Bulk User Actions ────────────────────────────────────

async function bulkDeleteUsers({ userIds }) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { error: "No user IDs provided.", statusCode: 400 };
  }

  const db = await readDB();
  const idSet = new Set(userIds);

  db.users = db.users.filter((u) => !idSet.has(u.id));
  db.userAssignments = (db.userAssignments || []).filter((a) => !idSet.has(a.userId));
  db.permissions = (db.permissions || []).filter((p) => !idSet.has(p.userId));

  await writeDB(db);

  try { emitBulkPermissionUpdate(userIds, { type: "user", action: "bulk-deleted" }); } catch (_) {}

  return { success: true, message: `${userIds.length} user(s) deleted.` };
}

async function bulkSuspendUsers({ userIds, suspended }) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { error: "No user IDs provided.", statusCode: 400 };
  }

  const db = await readDB();
  for (const id of userIds) {
    const user = db.users.find((u) => u.id === id);
    if (user) user.suspended = !!suspended;
  }
  await writeDB(db);

  try { emitBulkPermissionUpdate(userIds, { type: "user", action: suspended ? "suspended" : "unsuspended" }); } catch (_) {}

  return { success: true, message: `${userIds.length} user(s) ${suspended ? "suspended" : "unsuspended"}.` };
}

// ─── Role Clone ───────────────────────────────────────────

async function cloneRole(id, { name, departmentId }) {
  const db = await readDB();
  const sourceRole = db.roles.find((r) => r.id === id);
  if (!sourceRole) {
    return { error: "Source role not found.", statusCode: 404 };
  }

  const newRole = {
    id: uuidv4(),
    name: name || `${sourceRole.name} (Copy)`,
    departmentId: departmentId || sourceRole.departmentId,
    createdAt: new Date().toISOString(),
  };

  db.roles.push(newRole);

  const sourceTemplates = (db.permissionTemplates || []).filter(
    (t) => t.assigneeType === "role" && t.assigneeId === id
  );

  for (const t of sourceTemplates) {
    if (!db.permissionTemplates) db.permissionTemplates = [];
    db.permissionTemplates.push({
      id: uuidv4(),
      assigneeType: "role",
      assigneeId: newRole.id,
      targetType: t.targetType,
      targetId: t.targetId,
      granted: t.granted,
      updatedAt: new Date().toISOString(),
    });
  }

  await writeDB(db);

  if (db.userAssignments) {
    const affectedUserIds = db.userAssignments
      .filter((a) => a.roleId === newRole.departmentId ? a.departmentId === newRole.departmentId : false)
      .map((a) => a.userId);
    if (affectedUserIds.length > 0) {
      try { emitBulkPermissionUpdate([...new Set(affectedUserIds)], { type: "role", action: "cloned", roleId: newRole.id }); } catch (_) {}
    }
  }

  return { statusCode: 201, success: true, role: newRole, copiedTemplates: sourceTemplates.length };
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
