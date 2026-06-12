const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { encryptData } = require('../middleware/encryption');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

router.get('/config', (req, res) => {
  const data = readJSON('hierarchyConfig.json');
  res.json(encryptData(data));
});

router.get('/data', (req, res) => {
  const data = readJSON('hierarchyData.json');
  res.json(encryptData(data));
});

module.exports = router;
