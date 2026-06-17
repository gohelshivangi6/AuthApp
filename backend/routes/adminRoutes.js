const express = require("express");
const router = express.Router();
const { requireAuth } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/adminAuth");
const {
  validateCreateDepartment, validateUpdateDepartment,
  validateCreateRole, validateUpdateRole,
  validateCreateUser, validateUpdateUser,
  validateCreateAssignment, validateUpdateAssignment,
  validateCreatePermission,
  validateBulkPermission,
  validateBulkSavePermission,
  validateCreatePermissionTemplate,
  validateApplyDepartmentPermission,
  validateApplyRolePermission,
  validateCreateWidget, validateUpdateWidget,
} = require("../middleware/adminValidate");
const ctrl = require("../controllers/adminController");

router.use(requireAuth, requireAdmin);

router.get("/users", ctrl.getUsers);
router.post("/users", validateCreateUser, ctrl.createUser);
router.post("/invite", ctrl.inviteUser);
router.post("/users/bulk", ctrl.bulkCreateUsers);
router.put("/users/:id", validateUpdateUser, ctrl.updateUser);
router.delete("/users/:id", ctrl.deleteUser);

router.get("/departments", ctrl.getDepartments);
router.post("/departments", validateCreateDepartment, ctrl.createDepartment);
router.put("/departments/:id", validateUpdateDepartment, ctrl.updateDepartment);
router.delete("/departments/:id", ctrl.deleteDepartment);

router.get("/roles", ctrl.getRoles);
router.post("/roles", validateCreateRole, ctrl.createRole);
router.put("/roles/:id", validateUpdateRole, ctrl.updateRole);
router.delete("/roles/:id", ctrl.deleteRole);

router.get("/assignments", ctrl.getAssignments);
router.post("/assignments", validateCreateAssignment, ctrl.createAssignment);
router.put("/assignments/:id", validateUpdateAssignment, ctrl.updateAssignment);
router.delete("/assignments/:id", ctrl.deleteAssignment);

router.get("/permissions", ctrl.getPermissions);
router.post("/permissions", validateCreatePermission, ctrl.createPermission);
router.delete("/permissions/:id", ctrl.deletePermission);
router.post("/permissions/bulk", validateBulkPermission, ctrl.bulkCreatePermissions);
router.post("/permissions/bulk-save", validateBulkSavePermission, ctrl.bulkSavePermissions);

router.get("/permission-templates", ctrl.getPermissionTemplates);
router.post("/permission-templates", validateCreatePermissionTemplate, ctrl.upsertPermissionTemplate);
router.delete("/permission-templates/:id", ctrl.deletePermissionTemplate);

router.post("/permissions/apply-department", validateApplyDepartmentPermission, ctrl.applyDepartmentPermission);
router.post("/permissions/apply-role", validateApplyRolePermission, ctrl.applyRolePermission);

router.get("/widgets", ctrl.getWidgets);
router.post("/widgets", validateCreateWidget, ctrl.createWidget);
router.put("/widgets/:id", validateUpdateWidget, ctrl.updateWidget);
router.delete("/widgets/:id", ctrl.deleteWidget);

router.get("/dashboards", ctrl.getDashboards);
router.get("/dashboards/:slug/layout", ctrl.getDashboardLayout);
router.put("/dashboards/:slug/layout", ctrl.updateDashboardLayout);

router.get("/stats", ctrl.getStats);
router.get("/activity-logs", ctrl.getActivityLogs);
router.get("/users/:userId/stats", ctrl.getUserStats);

module.exports = router;
