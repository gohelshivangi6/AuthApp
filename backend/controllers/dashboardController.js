const dashboardService = require("../services/dashboardService");

async function getDashboardData(req, res, next) {
  try {
    const result = await dashboardService.getDashboardData(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getAllowedDashboards(req, res, next) {
  try {
    const result = await dashboardService.getAllowedDashboards(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getSectionPermissions(req, res, next) {
  try {
    const result = await dashboardService.getSectionPermissions(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

module.exports = { getDashboardData, getAllowedDashboards, getSectionPermissions };
