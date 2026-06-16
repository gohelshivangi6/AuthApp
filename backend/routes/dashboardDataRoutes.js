const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { encryptData } = require('../middleware/encryption');
const { sessionToken } = require('../middleware/sessionToken');
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

module.exports = router;
