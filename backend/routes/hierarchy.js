const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

router.get('/config', (req, res) => {
  res.json(readJSON('hierarchyConfig.json'));
});

router.get('/data', (req, res) => {
  res.json(readJSON('hierarchyData.json'));
});

module.exports = router;
