const express = require("express");
const router = express.Router();
const { getDashboardData, getAllowedDashboards } = require("../controllers/dashboardController");
const { requireAuth } = require("../controllers/authController");

router.get("/", requireAuth, getDashboardData);
router.get("/allowed", requireAuth, getAllowedDashboards);

module.exports = router;
