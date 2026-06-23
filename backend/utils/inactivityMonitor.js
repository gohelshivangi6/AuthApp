const { readDB, writeDB } = require('./dbHelper');
const { sendInactivityWarningEmail } = require('../services/emailService');
const { getActiveUserIds, emitInactivityWarning, forceDisconnectUser } = require('./websocket');
const { v4: uuidv4 } = require('uuid');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const INACTIVITY_TIMEOUT_MS = parseInt(process.env.INACTIVITY_TIMEOUT_MS, 10) || 15 * 60 * 1000;
const GRACE_PERIOD_MS = parseInt(process.env.GRACE_PERIOD_MS, 10) || 2 * 60 * 1000;
const MONITOR_INTERVAL_MS = parseInt(process.env.MONITOR_INTERVAL_MS, 10) || 30000;

async function checkInactivity() {
  try {
    const db = await readDB();
    if (!db.users || db.users.length === 0) return;

    const now = Date.now();
    console.log("Now ", now);
    const activeIds = new Set(getActiveUserIds());
    console.log("active ids", activeIds);
    let changed = false;

    for (const user of db.users) {
      if (user.role === 'admin' || user.status !== 'VERIFIED') continue;
      if (user.adminForceLoggedOutAt) continue;

      const lastActive = user.lastActivityAt ? new Date(user.lastActivityAt).getTime() : null;
      if (!lastActive) continue;
      console.log("last activity ", lastActive);

      const inactiveDuration = now - lastActive;
      console.log("inactive duration ", inactiveDuration);
      const hasPending = user.pendingInactivityLogout != null;
      console.log("pending logout ", hasPending);
      const pendingExpiry = hasPending ? new Date(user.pendingInactivityLogout).getTime() : null;
      console.log("oending expiry ", pendingExpiry);

      if (pendingExpiry && pendingExpiry <= now) {
        user.adminForceLoggedOutAt = new Date().toISOString();
        user.pendingInactivityLogout = null;
        user.inactivityToken = null;
        changed = true;
        forceDisconnectUser(user.id);
        continue;
      }

      if (hasPending) continue;

      if (inactiveDuration >= INACTIVITY_TIMEOUT_MS) {
        const token = uuidv4();
        user.pendingInactivityLogout = new Date(now + GRACE_PERIOD_MS).toISOString();
        user.inactivityToken = token;
        changed = true;

        // console.log('user id before', user.id);
        // if (activeIds.has(user.id)) {
        //   console.log('user id', user.id);
        //   emitInactivityWarning(user.id);
        // }
        emitInactivityWarning(user.id);

        const stayActiveLink = `${FRONTEND_URL}/stay-active?token=${token}&userId=${user.id}`;

        await sendInactivityWarningEmail(user, token);
      }
    }

    if (changed) await writeDB(db);
  } catch (err) {
    console.error('[InactivityMonitor] Error:', err);
  }
}

function initInactivityMonitor() {
  console.log('[InactivityMonitor] Starting...');
  checkInactivity().catch((err) => console.error('[InactivityMonitor] Initial check failed:', err));
  setInterval(() => {
    console.log("...");
    checkInactivity().catch((err) => console.error('[InactivityMonitor] Periodic check failed:', err));
  }, MONITOR_INTERVAL_MS);
}

module.exports = { initInactivityMonitor };
