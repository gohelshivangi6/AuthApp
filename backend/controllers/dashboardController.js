const { readDB } = require("../utils/dbHelper");

async function getDashboardData(req, res, next) {
  try {
    const db = await readDB();
    const userId = req.user.id;
    const userAssignments = (db.userAssignments || []).filter((a) => a.userId === userId);
    const permissions = (db.permissions || []).filter((p) => p.userId === userId);

    const allowedDeptIds = new Set();

    const userDeptPerms = permissions.filter((p) => p.targetType === "department");
    for (const a of userAssignments) {
      const explicitPerm = userDeptPerms.find((p) => p.targetId === a.departmentId);
      if (explicitPerm) {
        if (explicitPerm.granted) allowedDeptIds.add(a.departmentId);
      } else {
        allowedDeptIds.add(a.departmentId);
      }
    }

    for (const p of userDeptPerms) {
      if (p.granted) allowedDeptIds.add(p.targetId);
      else allowedDeptIds.delete(p.targetId);
    }

    const departments = (db.departments || []).filter((d) => allowedDeptIds.has(d.id));
    const roles = db.roles || [];
    const allWidgets = db.widgets || [];

    const widgetPerms = permissions.filter((p) => p.targetType === "widget");
    const allowedWidgetIds = new Set();

    for (const w of allWidgets) {
      const explicitPerm = widgetPerms.find((p) => p.targetId === w.id);
      if (explicitPerm) {
        if (explicitPerm.granted) allowedWidgetIds.add(w.id);
      } else if (w.defaultEnabled) {
        allowedWidgetIds.add(w.id);
      }
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

    res.json({
      success: true,
      departments: departmentsWithRoles,
      widgets,
    });
  } catch (err) { next(err); }
}

async function getAllowedDashboards(req, res, next) {
  try {
    const db = await readDB();
    const userId = req.user.id;
    const userPerms = (db.permissions || []).filter((p) => p.userId === userId && p.targetType === "dashboard");
    const allDashboards = db.dashboards || [];

    const allowed = allDashboards.filter((d) => {
      const perm = userPerms.find((p) => p.targetId === d.id);
      return perm ? perm.granted : false;
    });

    res.json({ success: true, dashboards: allowed });
  } catch (err) { next(err); }
}

async function getSectionPermissions(req, res, next) {
  try {
    const db = await readDB();
    const userId = req.user.id;
    const sectionPerms = (db.permissions || []).filter(
      (p) => p.userId === userId && p.targetType === "dashboard-section"
    );
    res.json({ success: true, permissions: sectionPerms });
  } catch (err) { next(err); }
}

module.exports = { getDashboardData, getAllowedDashboards, getSectionPermissions };
