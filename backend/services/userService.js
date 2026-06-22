const { readDB, writeDB } = require('../utils/dbHelper');

function getUserById(db, id) {
  return db.users.find((u) => u.id === id);
}

function findUserByEmail(db, email) {
  return db.users.find((u) => u.email === email);
}

function findUserIndex(db, id) {
  return db.users.findIndex((u) => u.id === id);
}

function isLocked(user) {
  if (!user.lockUntil) return false;
  return new Date(user.lockUntil).getTime() > Date.now();
}

function getLockRemainingMinutes(user) {
  return Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
}

const ACTIVITY_THROTTLE_MS = parseInt(process.env.ACTIVITY_THROTTLE_MS, 10) || 60000;

async function updateLastActivity(db, user) {
  const lastActive = user.lastActivityAt ? new Date(user.lastActivityAt).getTime() : 0;
  if (Date.now() - lastActive > ACTIVITY_THROTTLE_MS) {
    user.lastActivityAt = new Date().toISOString();
    return true;
  }
  return false;
}

function clearInactivityFlags(user) {
  user.pendingInactivityLogout = null;
  user.inactivityToken = null;
}

function generateAuthResponse(user, token) {
  return {
    success: true,
    message: "Login successful.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      hasTwoFactor: !!user.twoFactorSecretEncrypted,
      suspended: user.suspended || false,
    },
  };
}

module.exports = {
  getUserById,
  findUserByEmail,
  findUserIndex,
  isLocked,
  getLockRemainingMinutes,
  updateLastActivity,
  clearInactivityFlags,
  generateAuthResponse,
};