const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("./validate");

const validateCreateDepartment = [
  body("name").trim().notEmpty().withMessage("Department name is required"),
  body("description").optional().trim(),
  handleValidationErrors,
];

const validateUpdateDepartment = [
  param("id").isUUID().withMessage("Invalid department ID"),
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim(),
  handleValidationErrors,
];

const validateCreateRole = [
  body("name").trim().notEmpty().withMessage("Role name is required"),
  body("departmentId").isUUID().withMessage("Invalid department ID"),
  handleValidationErrors,
];

const validateUpdateRole = [
  param("id").isUUID().withMessage("Invalid role ID"),
  body("name").optional().trim().notEmpty(),
  handleValidationErrors,
];

const validateCreateUser = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("roleId").optional().isUUID().withMessage("Invalid role ID"),
  handleValidationErrors,
];

const validateUpdateUser = [
  param("id").isUUID().withMessage("Invalid user ID"),
  body("name").optional().trim().notEmpty(),
  body("email").optional().isEmail(),
  body("role").optional(),
  body("roleId").optional({ nullable: true }).custom((v) => v === null || /^[0-9a-f-]{36}$/i.test(v)).withMessage("Invalid role ID"),
  handleValidationErrors,
];

const validateCreateAssignment = [
  body("userId").isUUID().withMessage("Invalid user ID"),
  body("departmentId").isUUID().withMessage("Invalid department ID"),
  body("roleId").isUUID().withMessage("Invalid role ID"),
  handleValidationErrors,
];

const validateUpdateAssignment = [
  param("id").isUUID().withMessage("Invalid assignment ID"),
  body("departmentId").optional().isUUID(),
  body("roleId").optional().isUUID(),
  handleValidationErrors,
];

const validateCreatePermission = [
  body("userId").isUUID().withMessage("Invalid user ID"),
  body("targetType")
    .isIn(["department", "widget", "dashboard", "dashboard-section"])
    .withMessage("targetType must be 'department', 'widget', 'dashboard', or 'dashboard-section'"),
  body("targetId").custom((value, { req }) => {
    if (req.body.targetType === "dashboard-section") {
      if (!/^[a-z0-9-]+::[a-zA-Z]+$/.test(value)) {
        throw new Error("targetId must be 'slug::sectionName' for dashboard-section (e.g. 'revenue-ops-pulse::kpiCards')");
      }
      return true;
    }
    if (!/^[0-9a-f-]{36}$/i.test(value)) {
      throw new Error("Invalid target ID, must be a UUID");
    }
    return true;
  }),
  body("granted").isBoolean().withMessage("granted must be boolean"),
  handleValidationErrors,
];

const validateCreateWidget = [
  body("name").trim().notEmpty().withMessage("Widget name is required"),
  body("componentName")
    .trim()
    .notEmpty()
    .withMessage("Component name is required"),
  body("description").optional().trim(),
  handleValidationErrors,
];

const validateUpdateWidget = [
  param("id").isUUID().withMessage("Invalid widget ID"),
  body("name").optional().trim().notEmpty(),
  body("componentName").optional().trim().notEmpty(),
  body("description").optional().trim(),
  handleValidationErrors,
];

const validateBulkPermission = [
  body("userIds").isArray({ min: 1 }).withMessage("userIds must be a non-empty array"),
  body("userIds.*").isUUID().withMessage("Each userId must be a valid UUID"),
  body("targetType")
    .isIn(["department", "widget", "dashboard", "dashboard-section"])
    .withMessage("targetType must be 'department', 'widget', 'dashboard', or 'dashboard-section'"),
  body("targetId").custom((value, { req }) => {
    if (req.body.targetType === "dashboard-section") {
      if (!/^[a-z0-9-]+::[a-zA-Z]+$/.test(value)) {
        throw new Error("targetId must be 'slug::sectionName' for dashboard-section (e.g. 'revenue-ops-pulse::kpiCards')");
      }
      return true;
    }
    if (!/^[0-9a-f-]{36}$/i.test(value)) {
      throw new Error("Invalid target ID, must be a UUID");
    }
    return true;
  }),
  body("granted").isBoolean().withMessage("granted must be boolean"),
  handleValidationErrors,
];

const validateCreatePermissionTemplate = [
  body("assigneeType").isIn(["role", "department"]).withMessage("assigneeType must be 'role' or 'department'"),
  body("assigneeId").isUUID().withMessage("Invalid assignee ID"),
  body("targetType")
    .isIn(["department", "widget", "dashboard", "dashboard-section"])
    .withMessage("targetType must be 'department', 'widget', 'dashboard', or 'dashboard-section'"),
  body("targetId").custom((value, { req }) => {
    if (req.body.targetType === "dashboard-section") {
      if (!/^[a-z0-9-]+::[a-zA-Z]+$/.test(value)) {
        throw new Error("targetId must be 'slug::sectionName' for dashboard-section (e.g. 'revenue-ops-pulse::kpiCards')");
      }
      return true;
    }
    if (!/^[0-9a-f-]{36}$/i.test(value)) {
      throw new Error("Invalid target ID, must be a UUID");
    }
    return true;
  }),
  body("granted").isBoolean().withMessage("granted must be boolean"),
  handleValidationErrors,
];

const validateApplyDepartmentPermission = [
  body("departmentId").isUUID().withMessage("Invalid department ID"),
  body("targetType")
    .isIn(["department", "widget", "dashboard", "dashboard-section"])
    .withMessage("targetType must be 'department', 'widget', 'dashboard', or 'dashboard-section'"),
  body("targetId").custom((value, { req }) => {
    if (req.body.targetType === "dashboard-section") {
      if (!/^[a-z0-9-]+::[a-zA-Z]+$/.test(value)) {
        throw new Error("targetId must be 'slug::sectionName' for dashboard-section (e.g. 'revenue-ops-pulse::kpiCards')");
      }
      return true;
    }
    if (!/^[0-9a-f-]{36}$/i.test(value)) {
      throw new Error("Invalid target ID, must be a UUID");
    }
    return true;
  }),
  body("granted").isBoolean().withMessage("granted must be boolean"),
  body("applyTo").isIn(["all", "future"]).withMessage("applyTo must be 'all' or 'future'"),
  handleValidationErrors,
];

const validateApplyRolePermission = [
  body("roleId").isUUID().withMessage("Invalid role ID"),
  body("targetType")
    .isIn(["department", "widget", "dashboard", "dashboard-section"])
    .withMessage("targetType must be 'department', 'widget', 'dashboard', or 'dashboard-section'"),
  body("targetId").custom((value, { req }) => {
    if (req.body.targetType === "dashboard-section") {
      if (!/^[a-z0-9-]+::[a-zA-Z]+$/.test(value)) {
        throw new Error("targetId must be 'slug::sectionName' for dashboard-section (e.g. 'revenue-ops-pulse::kpiCards')");
      }
      return true;
    }
    if (!/^[0-9a-f-]{36}$/i.test(value)) {
      throw new Error("Invalid target ID, must be a UUID");
    }
    return true;
  }),
  body("granted").isBoolean().withMessage("granted must be boolean"),
  body("applyTo").isIn(["all", "future"]).withMessage("applyTo must be 'all' or 'future'"),
  handleValidationErrors,
];

module.exports = {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateCreateRole,
  validateUpdateRole,
  validateCreateUser,
  validateUpdateUser,
  validateCreateAssignment,
  validateUpdateAssignment,
  validateCreatePermission,
  validateBulkPermission,
  validateCreatePermissionTemplate,
  validateApplyDepartmentPermission,
  validateApplyRolePermission,
  validateCreateWidget,
  validateUpdateWidget,
};
