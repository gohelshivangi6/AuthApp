const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { encryptData } = require('../middleware/encryption');
const { sessionToken } = require('../middleware/sessionToken');
const { readDB } = require('../utils/dbHelper');
const DATA_DIR = path.join(__dirname, '..', 'data');

const DASHBOARD_FILES = {
  'revenue-ops-pulse': 'revenueOpsPulse.json',
  'leadership-command-center': 'leadershipCommandCenter.json',
  'product-engagement-tracker': 'productEngagementTracker.json',
  'global-sales-cockpit': 'globalSalesCockpit.json',
};

router.get('/:name', sessionToken, (req, res) => {
  const filename = DASHBOARD_FILES[req.params.name];
  if (!filename) {
    return res.status(404).json({ success: false, message: 'Dashboard not found' });
  }
  const filePath = path.join(DATA_DIR, filename);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(encryptData(data));
});

router.get('/:name/layout', sessionToken, async (req, res) => {
  try {
    const db = await readDB();
    const layouts = db.dashboardLayouts || [];
    const layout = layouts.find((l) => l.slug === req.params.name);
    if (layout) {
      res.json({ success: true, layout });
    } else {
      res.json({
        success: true,
        layout: {
          slug: req.params.name,
          sectionOrder: ["kpiCards", "charts", "tables"],
          kpiCardsOrder: [],
          chartsOrder: [],
          tablesOrder: [],
        },
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load layout' });
  }
});

module.exports = router;
