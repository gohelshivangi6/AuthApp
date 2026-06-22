const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../utils/dbHelper');

const LOG_THROTTLE_MS = parseInt(process.env.ACTIVITY_LOG_THROTTLE_MS, 10) || 30000;
const lastActivityLog = new Map();

let io = null;

function setIO(ioInstance) {
  io = ioInstance;
}

async function logActivity(userId, type, metadata = {}) {
  const now = Date.now();
  const lastLog = lastActivityLog.get(userId) || 0;
  if (now - lastLog < LOG_THROTTLE_MS && type === "event") return false;

  try {
    const db = await readDB();
    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.push({
      id: uuidv4(),
      userId,
      type,
      timestamp: new Date().toISOString(),
      metadata,
    });
    if (db.activityLogs.length > 10000) {
      db.activityLogs = db.activityLogs.slice(-5000);
    }
    await writeDB(db);
    lastActivityLog.set(userId, now);

    if (io) {
      io.of("/user").emit("stats-updated");
    }
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = {
  logActivity,
  setIO,
};