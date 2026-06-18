const { readDB, writeDB } = require('./dbHelper');
const { emitDeletionUpdate } = require('./websocket');

// Time limit for incomplete 2FA signup (24 hours in milliseconds)
const SIGNUP_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/**
 * Sweeps the database to remove users in 'PENDING_2FA' state who created their accounts
 * more than 24 hours ago and never verified.
 */
async function pruneIncompleteSignups() {
  console.log('[Cleanup] Starting sweep of incomplete signups...');
  try {
    const db = await readDB();
    if (!db.users || db.users.length === 0) {
      return;
    }

    const now = Date.now();
    const initialCount = db.users.length;
    
    // Filter out expired unverified users
    db.users = db.users.filter(user => {
      if (user.status === 'PENDING_2FA') {
        const createdAt = new Date(user.createdAt).getTime();
        if (now - createdAt > SIGNUP_TIMEOUT_MS) {
          console.log(`[Cleanup] Pruning unverified registration: ${user.email} (Created: ${user.createdAt})`);
          return false;
        }
      }
      return true;
    });

    const prunedCount = initialCount - db.users.length;
    if (prunedCount > 0) {
      await writeDB(db);
      console.log(`[Cleanup] Completed sweep. Pruned ${prunedCount} unverified account(s).`);
    } else {
      console.log('[Cleanup] Completed sweep. No accounts required pruning.');
    }
  } catch (error) {
    console.error('[Cleanup] Error during sweep:', error);
  }
}

// Time limit for deletion grace period (2 minutes)
const DELETE_GRACE_PERIOD_MS = 2 * 60 * 1000;

/**
 * Sweeps the database to remove users whose pending deletion grace period has expired.
 */
async function prunePendingDeletions() {
  console.log('[Cleanup] Checking pending deletions...');
  try {
    const db = await readDB();
    if (!db.users || db.users.length === 0) return;

    const now = new Date().toISOString();
    const toDelete = db.users.filter(
      (u) => u.pendingDeleteAt && u.pendingDeleteAt < now
    );

    for (const user of toDelete) {
      console.log(`[Cleanup] Permanently deleting user ${user.email} (grace period expired)`);
    }

    const deleteIds = new Set(toDelete.map((u) => u.id));
    if (deleteIds.size === 0) return;

    db.users = db.users.filter((u) => !deleteIds.has(u.id));
    db.userAssignments = (db.userAssignments || []).filter((a) => !deleteIds.has(a.userId));
    db.permissions = (db.permissions || []).filter((p) => !deleteIds.has(p.userId));

    await writeDB(db);

    for (const id of deleteIds) {
      try { emitDeletionUpdate({ type: "deleted", userId: id }); } catch (_) {}
    }

    console.log(`[Cleanup] Deleted ${deleteIds.size} user(s) with expired grace periods.`);
  } catch (error) {
    console.error('[Cleanup] Error during pending deletion sweep:', error);
  }
}

/**
 * Initializes the periodic cleanup timer.
 * Runs immediately, then every 30 minutes.
 */
function initCleanupTask() {
  // Run once on startup
  pruneIncompleteSignups().catch(err => console.error('[Cleanup] Startup sweep failed:', err));
  prunePendingDeletions().catch(err => console.error('[Cleanup] Startup deletion sweep failed:', err));

  // Schedule periodic runs every 30 minutes
  const intervalMs = 30 * 60 * 1000;
  setInterval(() => {
    pruneIncompleteSignups().catch(err => console.error('[Cleanup] Periodic sweep failed:', err));
  }, intervalMs);

  // Schedule pending deletion sweep every 30 seconds
  setInterval(() => {
    prunePendingDeletions().catch(err => console.error('[Cleanup] Periodic deletion sweep failed:', err));
  }, 30000);
}

module.exports = {
  initCleanupTask,
  pruneIncompleteSignups,
  prunePendingDeletions,
};
