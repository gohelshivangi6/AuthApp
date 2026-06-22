const { readDB, writeDB } = require('./dbHelper');
const { sendEmail } = require('./mailer');
const { getActiveUserIds, emitInactivityWarning, forceDisconnectUser } = require('./websocket');
const { v4: uuidv4 } = require('uuid');

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const GRACE_PERIOD_MS = 2 * 60 * 1000;

async function checkInactivity() {
  try {
    const db = await readDB();
    if (!db.users || db.users.length === 0) return;

    const now = Date.now();
    const activeIds = new Set(getActiveUserIds());
    let changed = false;

    for (const user of db.users) {
      if (user.role === 'admin' || user.status !== 'VERIFIED') continue;
      if (user.adminForceLoggedOutAt) continue;

      const lastActive = user.lastActivityAt ? new Date(user.lastActivityAt).getTime() : null;
      if (!lastActive) continue;

      const inactiveDuration = now - lastActive;
      const hasPending = user.pendingInactivityLogout != null;
      const pendingExpiry = hasPending ? new Date(user.pendingInactivityLogout).getTime() : null;

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
        user.lastActiveAt = new Date().toISOString();
        changed = true;

        if (activeIds.has(user.id)) {
          emitInactivityWarning(user.id);
        }

        const stayActiveLink = `http://localhost:5173/stay-active?token=${token}&userId=${user.id}`;

        await sendEmail({
          to: user.email,
          subject: 'Are you still there?',
          text: `Hello ${user.name},\n\nYou've been inactive for 15 minutes. If you want to stay logged in, click the link below within 2 minutes:\n\n${stayActiveLink}\n\nIf you do not respond, you will be automatically logged out.`,
          html: `<p>Hello ${user.name},</p><p>You've been inactive for 15 minutes.</p><p><a href="${stayActiveLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Stay Active</a></p><p>If you do not respond within <strong>2 minutes</strong>, you will be automatically logged out.</p>`,
        });
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
    checkInactivity().catch((err) => console.error('[InactivityMonitor] Periodic check failed:', err));
  }, 30000);
}

module.exports = { initInactivityMonitor };
