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
const { sendEmail } = require("../utils/mailer");
// const { removeToken, registerToken } = require("../middleware/sessionToken");

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_jwt_secret_for_development_purposes";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 365 * 24 * 60 * 60 * 1000, // 365 hour
};

/**
 * Signs a short-lived token for temporary states (like pending 2FA).
 */
const signTempToken = (userId, type) => {
  return jwt.sign({ userId, type }, JWT_SECRET, { expiresIn: "365d" });
};

/**
 * Signs a long-lived token for authorized user sessions.
 */
const signAuthToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "365d" });
};

/**
 * Helper to check lockout status.
 */
const isLocked = (user) => {
  if (!user.lockUntil) return false;
  return new Date(user.lockUntil).getTime() > Date.now();
};

/**
 * Handler for user registration (Signup).
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const db = await readDB();

    // Check if user already exists
    const existingUser = db.users.find((u) => u.email === email);
    if (existingUser) {
      // If the existing user is fully verified, we block signup
      if (existingUser.status === "VERIFIED") {
        return res.status(400).json({
          success: false,
          message: "An account with this email address already exists.",
        });
      }

      // If the user started signup but never completed 2FA, we allow them to override it
      // This solves the incomplete 2FA signup deadlock
      console.log(
        `[Signup] Overriding unverified pending registration for email: ${email}`,
      );
      db.users = db.users.filter((u) => u.email !== email);
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Generate TOTP Secret for 2FA setup
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
    };

    db.users.push(newUser);
    await writeDB(db);

    // Generate QR Code data URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Sign a temporary token for completing 2FA setup
    const tempToken = signTempToken(newUser.id, "registration_pending_2fa");

    // Simulate sending welcome/verification email
    await sendEmail({
      to: email,
      subject: "Welcome to SecureAuthApp - Finish 2FA Registration",
      text: `Hello ${name},\n\nPlease complete your registration by configuring Two-Factor Authentication.\nYour 2FA manual entry code is: ${secret.base32}`,
      html: `<p>Hello ${name},</p><p>Please complete your registration by configuring Two-Factor Authentication.</p><p>Your 2FA manual entry code is: <strong>${secret.base32}</strong></p>`,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration started. Please configure Two-Factor Authentication.",
      tempToken,
      qrCodeUrl,
      manualSecret: secret.base32,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies and enables 2FA setup (Completes Signup).
 */
const verify2FASetup = async (req, res, next) => {
  try {
    const { code } = req.body;

    // Express-validator makes sure code is valid structure
    // Extract authorization token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization token required." });
    }
    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid or expired 2FA setup session.",
        });
    }

    if (decoded.type !== "registration_pending_2fa") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid session context." });
    }

    const db = await readDB();
    const userIndex = db.users.findIndex((u) => u.id === decoded.userId);
    if (userIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const user = db.users[userIndex];

    // Decrypt the secret key
    const secret = decrypt(user.twoFactorSecretEncrypted);

    const expected = speakeasy.totp({
      secret,
      encoding: "base32",
    });

    if (!secret) {
      return res
        .status(500)
        .json({ success: false, message: "Encryption cipher failure." });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: code,
      window: 1, // Allow 30 seconds clock drift skew
    });

    if (!verified) {
      // Limit verification failures to prevent brute force on 6-digit codes
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lockout
        user.failedAttempts = 0;
        await writeDB(db);
        return res.status(403).json({
          success: false,
          message:
            "Too many invalid attempts. This account is locked for 15 minutes.",
        });
      }
      await writeDB(db);
      return res.status(400).json({
        success: false,
        message: `Invalid 2FA verification code. ${5 - user.failedAttempts} attempts remaining.`,
      });
    }

    // Success: Enable 2FA, complete registration
    user.status = "VERIFIED";
    user.failedAttempts = 0;
    user.lockUntil = null;
    await writeDB(db);

    // Issue permanent auth token
    const authToken = signAuthToken(user.id);
    res.cookie("token", authToken, COOKIE_OPTIONS);
    // registerToken(req.sessionNonce);
    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication configured successfully.",
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user authentication (Password check).
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = await readDB();

    const user = db.users.find((u) => u.email === email);
    if (!user) {
      // Use generic error message to prevent account enumeration
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // Check if locked
    if (isLocked(user)) {
      const lockRemaining = Math.ceil(
        (new Date(user.lockUntil).getTime() - Date.now()) / 60000,
      );
      return res.status(403).json({
        success: false,
        message: `This account has been locked due to too many failed attempts. Try again in ${lockRemaining} minute(s).`,
      });
    }

    // Check password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        user.failedAttempts = 0;
        await writeDB(db);
        return res.status(403).json({
          success: false,
          message:
            "Too many failed login attempts. This account is locked for 15 minutes.",
        });
      }
      await writeDB(db);
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // Credentials match, reset failed counters
    user.failedAttempts = 0;
    user.lockUntil = null;
    await writeDB(db);

    // Check status:
    // CASE A: User has not finished their 2FA configuration
    if (user.status === "PENDING_2FA") {
      const secret = decrypt(user.twoFactorSecretEncrypted);
      const otpauth_url = speakeasy.otpauthURL({
        secret: secret,
        label: `SecureAuthApp (${user.email})`,
      });
      const qrCodeUrl = await qrcode.toDataURL(otpauth_url);
      const tempToken = signTempToken(user.id, "registration_pending_2fa");

      return res.status(200).json({
        success: true,
        status: "PENDING_2FA",
        message: "Registration incomplete. Please configure 2FA.",
        tempToken,
        qrCodeUrl,
        manualSecret: secret,
      });
    }

    // CASE B: User is VERIFIED but has no 2FA configured (e.g., admin account)
    if (user.status === "VERIFIED" && !user.twoFactorSecretEncrypted) {
      const authToken = signAuthToken(user.id);
      res.cookie("token", authToken, COOKIE_OPTIONS);
      return res.status(200).json({
        success: true,
        message: "Login successful.",
        token: authToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user",
        },
      });
    }

    // CASE C: User is fully verified, needs to input 2FA code to log in
    const tempToken = signTempToken(user.id, "pending_2fa_verification");
    return res.status(200).json({
      email: user.email,
      name: user.name,
      success: true,
      status: "PENDING_2FA_VERIFICATION",
      message: "Password verified. Please enter 2FA verification code.",
      tempToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies 2FA during Login.
 */
const verify2FALogin = async (req, res, next) => {
  try {
    const { code } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization token required." });
    }
    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid or expired 2FA login session.",
        });
    }

    if (decoded.type !== "pending_2fa_verification") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid session context." });
    }

    const db = await readDB();
    const userIndex = db.users.findIndex((u) => u.id === decoded.userId);
    if (userIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const user = db.users[userIndex];

    if (isLocked(user)) {
      const lockRemaining = Math.ceil(
        (new Date(user.lockUntil).getTime() - Date.now()) / 60000,
      );
      return res.status(403).json({
        success: false,
        message: `This account has been locked. Try again in ${lockRemaining} minute(s).`,
      });
    }

    const secret = decrypt(user.twoFactorSecretEncrypted);
    const verified = speakeasy.totp.verify({
      secret: secret,
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
        return res.status(403).json({
          success: false,
          message:
            "Too many invalid 2FA attempts. This account is locked for 15 minutes.",
        });
      }
      await writeDB(db);
      return res.status(400).json({
        success: false,
        message: `Invalid 2FA code. ${5 - user.failedAttempts} attempts remaining.`,
      });
    }

    // Reset lock/failed attempts, log in
    user.failedAttempts = 0;
    user.lockUntil = null;
    await writeDB(db);

    const authToken = signAuthToken(user.id);
    res.cookie("token", authToken, COOKIE_OPTIONS);
    // registerToken(req.sessionNonce);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiates the forgot password request.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const db = await readDB();

    const user = db.users.find((u) => u.email === email);

    // Unified response to prevent user existence checking
    const genericResponse = {
      success: true,
      message:
        "If that email is registered, a password reset link has been sent to it.",
    };

    if (!user || user.status !== "VERIFIED") {
      // Silently log and exit
      console.log(
        `[Forgot Password] Requested for non-existent or unverified email: ${email}`,
      );
      return res.status(200).json(genericResponse);
    }

    // Generate secure token and hashed version to store
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000,
    ).toISOString(); // 15 mins
    await writeDB(db);

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: "SecureAuthApp - Password Reset Request",
      text: `Hello ${user.name},\n\nYou requested a password reset. Reset your password here:\n${resetLink}\n\nThis link will expire in 15 minutes.`,
      html: `<p>Hello ${user.name},</p><p>You requested a password reset. Reset your password by clicking the link below:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link will expire in 15 minutes.</p>`,
    });

    console.log("Email sent successfully");

    res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Performs password reset.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const db = await readDB();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const userIndex = db.users.findIndex(
      (u) =>
        u.resetPasswordToken === hashedToken &&
        new Date(u.resetPasswordExpires).getTime() > Date.now(),
    );

    if (userIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }

    const user = db.users[userIndex];

    // Check if new password is same as old password
    const isSame = await comparePassword(password, user.passwordHash);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your old password.",
      });
    }

    user.passwordHash = await hashPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    // Reset lockout in case they were locked out
    user.failedAttempts = 0;
    user.lockUntil = null;

    await writeDB(db);

    await sendEmail({
      to: user.email,
      subject: "SecureAuthApp - Password Changed successfully",
      text: `Hello ${user.name},\n\nYour account password has been successfully updated. If you did not make this change, contact us immediately.`,
      html: `<p>Hello ${user.name},</p><p>Your account password has been successfully updated. If you did not make this change, contact us immediately.</p>`,
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logs out the user (clears cookies).
 */
const logout = (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

/**
 * Checks authentication status (verifies JWT token cookie).
 */
const checkStatus = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired session token." });
    }

    const db = await readDB();
    const user = db.users.find((u) => u.id === decoded.userId);
    if (!user || user.status !== "VERIFIED") {
      return res
        .status(401)
        .json({ success: false, message: "Account status invalid." });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authentication middleware for protecting API endpoints.
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. Sign in required." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await readDB();
    const user = db.users.find((u) => u.id === decoded.userId);

    if (!user || user.status !== "VERIFIED") {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid authorization token." });
  }
};

const me = async (req, res, next) => {
  try {
    // registerToken(req.sessionNonce);
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to retrieve user information.",
      });
  }
};

module.exports = {
  signup,
  verify2FASetup,
  login,
  verify2FALogin,
  forgotPassword,
  resetPassword,
  logout,
  checkStatus,
  requireAuth,
  me,
};
