const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../utils/dbHelper");
const { hashPassword } = require("../utils/cryptoHelper");
const { emitPermissionUpdate } = require("../utils/websocket");

// ─── Users ─────────────────────────────────────────────────

async function getUsers(req, res, next) {
  try {
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
          assignments: userAssignments,
        };
      });
    res.json({ success: true, users });
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, roleId } = req.body;
    const db = await readDB();

    if (db.users.find((u) => u.email === email)) {
      return res.status(400).json({ success: false, message: "Email already in use." });
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
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: { id: newUser.id, name, email, role: newUser.role, roleId: newUser.roleId },
    });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, roleId } = req.body;
    const db = await readDB();

    const user = db.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (roleId !== undefined) user.roleId = roleId;

    await writeDB(db);

    try { emitPermissionUpdate(id, { type: "user", user: { name: user.name, email: user.email, role: user.role, roleId: user.roleId } }); } catch (_) {}

    res.json({ success: true, message: "User updated." });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    db.users.splice(idx, 1);
    db.userAssignments = (db.userAssignments || []).filter((a) => a.userId !== id);
    db.permissions = (db.permissions || []).filter((p) => p.userId !== id);

    await writeDB(db);
    res.json({ success: true, message: "User deleted." });
  } catch (err) { next(err); }
}

// ─── Departments ────────────────────────────────────────────

async function getDepartments(req, res, next) {
  try {
    const db = await readDB();
    res.json({ success: true, departments: db.departments || [] });
  } catch (err) { next(err); }
}

async function createDepartment(req, res, next) {
  try {
    const { name, description } = req.body;
    const db = await readDB();

    const dept = {
      id: uuidv4(),
      name,
      description: description || "",
      createdAt: new Date().toISOString(),
    };

    db.departments.push(dept);
    await writeDB(db);

    res.status(201).json({ success: true, department: dept });
  } catch (err) { next(err); }
}

async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const db = await readDB();

    const dept = db.departments.find((d) => d.id === id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    if (name !== undefined) dept.name = name;
    if (description !== undefined) dept.description = description;

    await writeDB(db);
    res.json({ success: true, department: dept });
  } catch (err) { next(err); }
}

async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const idx = db.departments.findIndex((d) => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    db.departments.splice(idx, 1);
    db.roles = (db.roles || []).filter((r) => r.departmentId !== id);
    db.userAssignments = (db.userAssignments || []).filter((a) => a.departmentId !== id);
    db.permissions = (db.permissions || []).filter(
      (p) => !(p.targetType === "department" && p.targetId === id)
    );

    await writeDB(db);
    res.json({ success: true, message: "Department deleted." });
  } catch (err) { next(err); }
}

// ─── Roles ──────────────────────────────────────────────────

async function getRoles(req, res, next) {
  try {
    const db = await readDB();
    const { departmentId } = req.query;
    let roles = db.roles || [];
    if (departmentId) {
      roles = roles.filter((r) => r.departmentId === departmentId);
    }
    res.json({ success: true, roles });
  } catch (err) { next(err); }
}

async function createRole(req, res, next) {
  try {
    const { name, departmentId } = req.body;
    const db = await readDB();

    const role = {
      id: uuidv4(),
      name,
      departmentId,
      createdAt: new Date().toISOString(),
    };

    db.roles.push(role);
    await writeDB(db);

    res.status(201).json({ success: true, role });
  } catch (err) { next(err); }
}

async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const db = await readDB();

    const role = db.roles.find((r) => r.id === id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    if (name !== undefined) role.name = name;
    await writeDB(db);
    res.json({ success: true, role });
  } catch (err) { next(err); }
}

async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const idx = db.roles.findIndex((r) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    db.roles.splice(idx, 1);
    db.userAssignments = (db.userAssignments || []).filter((a) => a.roleId !== id);

    await writeDB(db);
    res.json({ success: true, message: "Role deleted." });
  } catch (err) { next(err); }
}

// ─── User-Department-Role Assignments ───────────────────────

async function getAssignments(req, res, next) {
  try {
    const db = await readDB();
    res.json({ success: true, assignments: db.userAssignments || [] });
  } catch (err) { next(err); }
}

async function createAssignment(req, res, next) {
  try {
    const { userId, departmentId, roleId } = req.body;
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

    res.status(201).json({ success: true, assignment });
  } catch (err) { next(err); }
}

async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { departmentId, roleId } = req.body;
    const db = await readDB();

    const assignment = db.userAssignments.find((a) => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    if (departmentId !== undefined) assignment.departmentId = departmentId;
    if (roleId !== undefined) assignment.roleId = roleId;

    await writeDB(db);

    try { emitPermissionUpdate(assignment.userId, { type: "assignment", action: "updated", departmentId: assignment.departmentId, roleId: assignment.roleId }); } catch (_) {}

    res.json({ success: true, assignment });
  } catch (err) { next(err); }
}

async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const idx = db.userAssignments.findIndex((a) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const assignment = db.userAssignments[idx];
    db.userAssignments.splice(idx, 1);
    await writeDB(db);

    try { emitPermissionUpdate(assignment.userId, { type: "assignment", action: "deleted" }); } catch (_) {}

    res.json({ success: true, message: "Assignment removed." });
  } catch (err) { next(err); }
}

// ─── Permissions ────────────────────────────────────────────

async function getPermissions(req, res, next) {
  try {
    const db = await readDB();
    const { userId } = req.query;
    let permissions = db.permissions || [];
    if (userId) {
      permissions = permissions.filter((p) => p.userId === userId);
    }
    res.json({ success: true, permissions });
  } catch (err) { next(err); }
}

async function createPermission(req, res, next) {
  try {
    const { userId, targetType, targetId, granted } = req.body;
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

    res.status(201).json({ success: true, permission });
  } catch (err) { next(err); }
}

async function deletePermission(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const idx = db.permissions.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Permission not found." });
    }

    const perm = db.permissions[idx];
    db.permissions.splice(idx, 1);
    await writeDB(db);

    const path = perm.targetType === "dashboard" ? (db.dashboards || []).find(d => d.id === perm.targetId)?.path : undefined;
    try { emitPermissionUpdate(perm.userId, { type: "permission", action: "delete", targetType: perm.targetType, targetId: perm.targetId, ...(path && { path }) }); } catch (_) {}

    res.json({ success: true, message: "Permission removed." });
  } catch (err) { next(err); }
}

// ─── Widgets ────────────────────────────────────────────────

async function getWidgets(req, res, next) {
  try {
    const db = await readDB();
    res.json({ success: true, widgets: db.widgets || [] });
  } catch (err) { next(err); }
}

async function createWidget(req, res, next) {
  try {
    const { name, componentName, description } = req.body;
    const db = await readDB();

    if ((db.widgets || []).find((w) => w.componentName === componentName)) {
      return res.status(400).json({ success: false, message: "Widget with this component already exists." });
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

    res.status(201).json({ success: true, widget });
  } catch (err) { next(err); }
}

async function updateWidget(req, res, next) {
  try {
    const { id } = req.params;
    const { name, componentName, description } = req.body;
    const db = await readDB();

    const widget = db.widgets.find((w) => w.id === id);
    if (!widget) {
      return res.status(404).json({ success: false, message: "Widget not found." });
    }

    if (name !== undefined) widget.name = name;
    if (componentName !== undefined) widget.componentName = componentName;
    if (description !== undefined) widget.description = description;

    await writeDB(db);
    res.json({ success: true, widget });
  } catch (err) { next(err); }
}

async function deleteWidget(req, res, next) {
  try {
    const { id } = req.params;
    const db = await readDB();

    const idx = db.widgets.findIndex((w) => w.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Widget not found." });
    }

    db.widgets.splice(idx, 1);
    db.permissions = (db.permissions || []).filter(
      (p) => !(p.targetType === "widget" && p.targetId === id)
    );

    await writeDB(db);
    res.json({ success: true, message: "Widget deleted." });
  } catch (err) { next(err); }
}

// ─── Dashboards ─────────────────────────────────────────────

async function getDashboards(req, res, next) {
  try {
    const db = await readDB();
    res.json({ success: true, dashboards: db.dashboards || [] });
  } catch (err) { next(err); }
}

// ─── Stats & Activity Logs ──────────────────────────────────

async function getStats(req, res, next) {
  try {
    const db = await readDB();
    const adminIds = new Set(db.users.filter((u) => u.role === "admin").map((u) => u.id));
    const logs = (db.activityLogs || []).filter((l) => !adminIds.has(l.userId));

    const totalUsers = db.users.filter((u) => !adminIds.has(u.id)).length;
    const totalSessions = logs.filter((l) => l.type === "session_start").length;
    const totalEvents = logs.filter((l) => l.type === "event").length;

    // Group session events by user to build accurate pairings
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

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalSessions,
        totalEvents,
        totalTimeSpentMs,
      },
    });
  } catch (err) { next(err); }
}

async function getActivityLogs(req, res, next) {
  try {
    const db = await readDB();
    const { userId, type, page = 1, limit = 50 } = req.query;

    let logs = db.activityLogs || [];

    if (userId) logs = logs.filter((l) => l.userId === userId);
    if (type) logs = logs.filter((l) => l.type === type);

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = logs.length;
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    const paged = logs.slice((p - 1) * l, p * l);

    res.json({ success: true, logs: paged, total, page: p, limit: l });
  } catch (err) { next(err); }
}

async function getUserStats(req, res, next) {
  try {
    const db = await readDB();
    const { userId } = req.params;
    const logs = (db.activityLogs || []).filter((l) => l.userId === userId);

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
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

    res.json({
      success: true,
      userStats: {
        name: user.name,
        email: user.email,
        totalSessions,
        totalEvents,
        totalTimeSpentMs,
        sessions: sessionPairs,
      },
    });
  } catch (err) { next(err); }
}

async function bulkCreateUsers(req, res, next) {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: "No users provided." });
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

    res.status(created.length > 0 ? 201 : 400).json({
      success: created.length > 0,
      created: created.length,
      failed: errors.length,
      errors,
    });
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
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  getDashboards,
  getStats,
  getActivityLogs,
  getUserStats,
};
