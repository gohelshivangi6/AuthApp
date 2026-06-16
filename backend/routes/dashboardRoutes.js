const express = require("express");
const router = express.Router();
const { getDashboardData, getAllowedDashboards, getSectionPermissions } = require("../controllers/dashboardController");
const { requireAuth } = require("../controllers/authController");

router.get("/", requireAuth, getDashboardData);
router.get("/allowed", requireAuth, getAllowedDashboards);
router.get("/section-permissions", requireAuth, getSectionPermissions);

module.exports = router;
