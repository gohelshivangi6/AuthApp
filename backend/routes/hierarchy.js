const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
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

router.post('/export/csv', (req, res) => {
  const { data, columns } = req.body;

  if (!Array.isArray(data) || !Array.isArray(columns) || columns.length === 0) {
    return res.status(400).json({ success: false, message: 'data and columns are required' });
  }

  const colDefs = columns.map(c => ({
    key: c.field,
    header: c.label,
  }));

  try {
    const csv = stringify(data, {
      header: true,
      columns: colDefs,
      cast: {
        string: (value) => value ?? '',
      },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hierarchy-export.csv"');
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate CSV' });
  }
});

module.exports = router;
