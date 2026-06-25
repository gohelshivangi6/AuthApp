const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const { readDB, writeDB } = require("../utils/dbHelper");
const {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
} = require("../utils/cryptoHelper");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require("../services/emailService");
const {
  isLocked,
  getLockRemainingMinutes,
  findUserByEmail,
  getUserById,
  findUserIndex,
} = require("../services/userService");
const { emitDeletionUpdate } = require("../utils/websocket");

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_jwt_secret_for_development_purposes";

function signTempToken(userId, type) {
  return jwt.sign({ userId, type }, JWT_SECRET, { expiresIn: "365d" });
}

function signAuthToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "365d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function signup({ name, email, password }) {
  const db = await readDB();

  const existingUser = findUserByEmail(db, email);
  if (existingUser) {
    if (existingUser.deletedAt) {
      db.users = db.users.filter((u) => u.email !== email);
    } else if (existingUser.status === "VERIFIED") {
      const err = new Error("An account with this email address already exists.");
      err.status = 400;
      throw err;
    } else {
      console.log(
        `[Signup] Overriding unverified pending registration for email: ${email}`,
      );
      db.users = db.users.filter((u) => u.email !== email);
    }
  }

  const hashedPassword = await hashPassword(password);

  const secret = speakeasy.generateSecret({
    name: `SecureAuthApp (${email})`,
  });

  const newUser = {
    id: uuidv4(),
    name,
    email,
    passwordHash: hashedPassword,
    role: "user",
    status: "PENDING_2FA",
    twoFactorSecretEncrypted: encrypt(secret.base32),
    failedAttempts: 0,
    lockUntil: null,
    createdAt: new Date().toISOString(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    lastActivityAt: null,
    pendingDeleteAt: null,
    deleteToken: null,
    suspended: false,
  };

  db.users.push(newUser);
  await writeDB(db);

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  const tempToken = signTempToken(newUser.id, "registration_pending_2fa");

  await sendWelcomeEmail(newUser);

  return { tempToken, qrCodeUrl, manualSecret: secret.base32 };
}

async function verify2FASetup({ code, token }) {
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    const error = new Error("Invalid or expired 2FA setup session.");
    error.status = 401;
    throw error;
  }

  if (decoded.type !== "registration_pending_2fa") {
    const err = new Error("Invalid session context.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();
  const userIndex = findUserIndex(db, decoded.userId);
  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const user = db.users[userIndex];
  const secret = decrypt(user.twoFactorSecretEncrypted);

  if (!secret) {
    const err = new Error("Encryption cipher failure.");
    err.status = 500;
    throw err;
  }

  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!verified) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      user.failedAttempts = 0;
      await writeDB(db);
      const err = new Error(
        "Too many invalid attempts. This account is locked for 15 minutes.",
      );
      err.status = 403;
      throw err;
    }
    await writeDB(db);
    const err = new Error(
      `Invalid 2FA verification code. ${5 - user.failedAttempts} attempts remaining.`,
    );
    err.status = 400;
    throw err;
  }

  user.status = "VERIFIED";
  user.failedAttempts = 0;
  user.lockUntil = null;
  user.lastActivityAt = new Date().toISOString();
  await writeDB(db);

  const authToken = signAuthToken(user.id);
  return { authToken, user };
}

async function login({ email, password }) {
  const db = await readDB();

  const user = findUserByEmail(db, email);
  if (!user) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  if (user.deletedAt) {
    const err = new Error("This account has been deleted. Contact your administrator.");
    err.status = 403;
    throw err;
  }

  if (user.suspended) {
    const err = new Error("This account has been suspended. Contact your administrator.");
    err.status = 403;
    throw err;
  }

  if (isLocked(user)) {
    const lockRemaining = getLockRemainingMinutes(user);
    const err = new Error(
      `This account has been locked due to too many failed attempts. Try again in ${lockRemaining} minute(s).`,
    );
    err.status = 403;
    throw err;
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      user.failedAttempts = 0;
      await writeDB(db);
      const err = new Error(
        "Too many failed login attempts. This account is locked for 15 minutes.",
      );
      err.status = 403;
      throw err;
    }
    await writeDB(db);
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  user.failedAttempts = 0;
  user.lockUntil = null;
  user.adminForceLoggedOutAt = null;
  await writeDB(db);

  if (user.status === "PENDING_2FA") {
    const secret = decrypt(user.twoFactorSecretEncrypted);
    const otpauth_url = speakeasy.otpauthURL({
      secret,
      label: `SecureAuthApp (${user.email})`,
    });
    const qrCodeUrl = await qrcode.toDataURL(otpauth_url);
    const tempToken = signTempToken(user.id, "registration_pending_2fa");

    return {
      case: "PENDING_2FA",
      tempToken,
      qrCodeUrl,
      manualSecret: secret,
    };
  }

  if (user.status === "VERIFIED" && !user.twoFactorSecretEncrypted) {
    user.lastActivityAt = new Date().toISOString();
    user.pendingDeleteAt = null;
    user.deleteToken = null;
    await writeDB(db);
    try { emitDeletionUpdate({ type: "cancelled", userId: user.id }); } catch (_) {}

    const authToken = signAuthToken(user.id);
    return { case: "VERIFIED_NO_2FA", authToken, user };
  }

  const tempToken = signTempToken(user.id, "pending_2fa_verification");
  return { case: "PENDING_2FA_VERIFICATION", tempToken, email: user.email, name: user.name };
}

async function verify2FALogin({ code, token }) {
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    const error = new Error("Invalid or expired 2FA login session.");
    error.status = 401;
    throw error;
  }

  if (decoded.type !== "pending_2fa_verification") {
    const err = new Error("Invalid session context.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();
  const userIndex = findUserIndex(db, decoded.userId);
  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const user = db.users[userIndex];

  if (isLocked(user)) {
    const lockRemaining = getLockRemainingMinutes(user);
    const err = new Error(
      `This account has been locked. Try again in ${lockRemaining} minute(s).`,
    );
    err.status = 403;
    throw err;
  }

  const secret = decrypt(user.twoFactorSecretEncrypted);
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!verified) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      user.failedAttempts = 0;
      await writeDB(db);
      const err = new Error(
        "Too many invalid 2FA attempts. This account is locked for 15 minutes.",
      );
      err.status = 403;
      throw err;
    }
    await writeDB(db);
    const err = new Error(
      `Invalid 2FA code. ${5 - user.failedAttempts} attempts remaining.`,
    );
    err.status = 400;
    throw err;
  }

  user.failedAttempts = 0;
  user.lockUntil = null;
  user.adminForceLoggedOutAt = null;
  user.lastActivityAt = new Date().toISOString();
  user.pendingDeleteAt = null;
  user.deleteToken = null;
  await writeDB(db);

  try { emitDeletionUpdate({ type: "cancelled", userId: user.id }); } catch (_) {}

  const authToken = signAuthToken(user.id);
  return { authToken, user };
}

async function forgotPassword({ email }) {
  const db = await readDB();

  const user = findUserByEmail(db, email);
  if (!user || user.status !== "VERIFIED" || user.deletedAt) {
    console.log(
      `[Forgot Password] Requested for non-existent or unverified email: ${email}`,
    );
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(
    Date.now() + 15 * 60 * 1000,
  ).toISOString();
  await writeDB(db);

  await sendPasswordResetEmail(user, resetToken);
  console.log("Email sent successfully");
}

async function resetPassword({ token, password }) {
  const db = await readDB();
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const userIndex = db.users.findIndex(
    (u) =>
      u.resetPasswordToken === hashedToken &&
      new Date(u.resetPasswordExpires).getTime() > Date.now(),
  );

  if (userIndex === -1) {
    const err = new Error("Password reset token is invalid or has expired.");
    err.status = 400;
    throw err;
  }

  const user = db.users[userIndex];

  const isSame = await comparePassword(password, user.passwordHash);
  if (isSame) {
    const err = new Error("New password cannot be the same as your old password.");
    err.status = 400;
    throw err;
  }

  user.passwordHash = await hashPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.failedAttempts = 0;
  user.lockUntil = null;
  await writeDB(db);

  await sendPasswordChangedEmail(user);
}

async function checkStatus({ token }) {
  if (!token) {
    const err = new Error("Not authenticated.");
    err.status = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    const error = new Error("Invalid or expired session token.");
    error.status = 401;
    throw error;
  }

  const db = await readDB();
  const user = getUserById(db, decoded.userId);
  if (!user || user.status !== "VERIFIED" || user.deletedAt) {
    const err = new Error("Account status invalid.");
    err.status = 401;
    throw err;
  }

  if (user.pendingDeleteAt) {
    user.pendingDeleteAt = null;
    user.deleteToken = null;
    await writeDB(db);
    try { emitDeletionUpdate({ type: "cancelled", userId: user.id }); } catch (_) {}
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    suspended: user.suspended || false,
  };
}

async function updateProfile({ userId, name }) {
  const db = await readDB();
  const userIndex = findUserIndex(db, userId);

  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  if (name !== undefined) {
    db.users[userIndex].name = name;
  }

  await writeDB(db);

  return {
    id: db.users[userIndex].id,
    name: db.users[userIndex].name,
    email: db.users[userIndex].email,
    role: db.users[userIndex].role || "user",
    hasTwoFactor: !!db.users[userIndex].twoFactorSecretEncrypted,
  };
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const db = await readDB();
  const userIndex = findUserIndex(db, userId);

  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const user = db.users[userIndex];

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    const err = new Error("Current password is incorrect.");
    err.status = 400;
    throw err;
  }

  const isSame = await comparePassword(newPassword, user.passwordHash);
  if (isSame) {
    const err = new Error("New password cannot be the same as your current password.");
    err.status = 400;
    throw err;
  }

  db.users[userIndex].passwordHash = await hashPassword(newPassword);
  await writeDB(db);
}

async function generate2FASecret({ userId }) {
  const db = await readDB();
  const userIndex = findUserIndex(db, userId);
  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const user = db.users[userIndex];
  if (user.twoFactorSecretEncrypted) {
    const err = new Error("Two-factor authentication is already enabled.");
    err.status = 400;
    throw err;
  }

  const secret = speakeasy.generateSecret({
    name: `SecureAuthApp (${user.email})`,
  });

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  const tempToken = jwt.sign(
    { userId, secret: secret.base32, type: "enable_2fa" },
    JWT_SECRET,
    { expiresIn: "10m" },
  );

  return { tempToken, qrCodeUrl, manualSecret: secret.base32 };
}

async function enable2FA({ userId, code, tempToken }) {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, JWT_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired 2FA setup session.");
    error.status = 401;
    throw error;
  }

  if (decoded.type !== "enable_2fa" || decoded.userId !== userId) {
    const err = new Error("Invalid session context.");
    err.status = 400;
    throw err;
  }

  const secret = decoded.secret;

  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!verified) {
    const err = new Error("Invalid verification code. Please try again.");
    err.status = 400;
    throw err;
  }

  const db = await readDB();
  const userIndex = findUserIndex(db, userId);
  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  db.users[userIndex].twoFactorSecretEncrypted = encrypt(secret);
  await writeDB(db);

  return {
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      role: db.users[userIndex].role || "user",
      hasTwoFactor: true,
    },
  };
}

async function disable2FA({ userId, password }) {
  const db = await readDB();
  const userIndex = findUserIndex(db, userId);
  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const user = db.users[userIndex];

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error("Current password is incorrect.");
    err.status = 400;
    throw err;
  }

  if (!user.twoFactorSecretEncrypted) {
    const err = new Error("Two-factor authentication is not enabled.");
    err.status = 400;
    throw err;
  }

  user.twoFactorSecretEncrypted = null;
  await writeDB(db);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      hasTwoFactor: false,
    },
  };
}

async function ping({ userId }) {
  const db = await readDB();
  const userIndex = findUserIndex(db, userId);

  if (userIndex === -1) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  db.users[userIndex].lastActivityAt = new Date().toISOString();
  db.users[userIndex].pendingInactivityLogout = null;
  await writeDB(db);
}

async function reactivateAccount({ token, userId }) {
  const db = await readDB();
  const user = getUserById(db, userId);

  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  if (user.deleteToken !== token) {
    const err = new Error("Invalid reactivation token.");
    err.status = 400;
    throw err;
  }

  if (!user.pendingDeleteAt) {
    const err = new Error("Account is not pending deletion.");
    err.status = 400;
    throw err;
  }

  user.pendingDeleteAt = null;
  user.deleteToken = null;
  user.lastActivityAt = new Date().toISOString();
  await writeDB(db);

  try { emitDeletionUpdate({ type: "cancelled", userId }); } catch (_) {}
}

async function getReactivateStatus({ token, userId }) {
  const db = await readDB();
  const user = getUserById(db, userId);

  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  if (user.deleteToken !== token) {
    const err = new Error("Invalid reactivation token.");
    err.status = 400;
    throw err;
  }

  if (!user.pendingDeleteAt) {
    const err = new Error("Account is not pending deletion.");
    err.status = 400;
    throw err;
  }

  const now = Date.now();
  const expiresAt = new Date(user.pendingDeleteAt).getTime();
  const remainingMs = Math.max(0, expiresAt - now);

  return {
    name: user.name,
    remainingMs,
    expired: remainingMs <= 0,
  };
}

async function stayActive({ token, userId }) {
  const db = await readDB();
  const user = getUserById(db, userId);

  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  if (user.inactivityToken !== token) {
    const err = new Error("Invalid or expired token.");
    err.status = 400;
    throw err;
  }

  const now = Date.now();
  const expiresAt = new Date(user.pendingInactivityLogout).getTime();

  if (!user.pendingInactivityLogout || expiresAt <= now) {
    user.pendingInactivityLogout = null;
    user.inactivityToken = null;
    user.lastActivityAt = new Date().toISOString();
    await writeDB(db);
    return { message: "Session was already expired, but has been refreshed." };
  }

  user.pendingInactivityLogout = null;
  user.inactivityToken = null;
  user.lastActivityAt = new Date().toISOString();
  await writeDB(db);

  return { message: "Session extended successfully." };
}

async function getInactivityStatus({ token, userId }) {
  const db = await readDB();
  const user = getUserById(db, userId);

  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  if (user.inactivityToken !== token) {
    return { status: "invalid" };
  }

  if (!user.pendingInactivityLogout) {
    return { status: "active" };
  }

  const now = Date.now();
  const expiresAt = new Date(user.pendingInactivityLogout).getTime();
  const remainingMs = Math.max(0, expiresAt - now);

  return {
    status: remainingMs > 0 ? "valid" : "expired",
    remainingMs,
    name: user.name,
  };
}

module.exports = {
  signup,
  verify2FASetup,
  login,
  verify2FALogin,
  forgotPassword,
  resetPassword,
  checkStatus,
  signAuthToken,
  updateProfile,
  changePassword,
  reactivateAccount,
  getReactivateStatus,
  generate2FASecret,
  enable2FA,
  disable2FA,
  ping,
  stayActive,
  getInactivityStatus,
  verifyToken,
};
