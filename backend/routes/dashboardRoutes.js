const express = require("express");
const router = express.Router();
const { getDashboardData } = require("../controllers/dashboardController");
const { requireAuth } = require("../controllers/authController");

router.get("/", requireAuth, getDashboardData);

module.exports = router;
