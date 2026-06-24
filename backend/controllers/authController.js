const jwt = require("jsonwebtoken");

const { readDB, writeDB } = require("../utils/dbHelper");
const {
  getUserById,
  clearInactivityFlags,
  isLocked,
} = require("../services/userService");
const {
  emitDeletionUpdate,
  removeLoggedOutUser,
} = require("../utils/websocket");
const authService = require("../services/authService");
const { revokeSessionToken } = require("../middleware/sessionToken");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 365 * 24 * 60 * 60 * 1000,
};

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_jwt_secret_for_development_purposes";

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.signup({ name, email, password });
    res.status(201).json({
      success: true,
      message:
        "Registration started. Please configure Two-Factor Authentication.",
      tempToken: result.tempToken,
      qrCodeUrl: result.qrCodeUrl,
      manualSecret: result.manualSecret,
    });
  } catch (error) {
    next(error);
  }
};

const verify2FASetup = async (req, res, next) => {
  try {
    const { code } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization token required." });
    }
    const token = authHeader.split(" ")[1];
    const result = await authService.verify2FASetup({ code, token });
    res.cookie("token", result.authToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication configured successfully.",
      token: result.authToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role || "user",
        hasTwoFactor: !!result.user.twoFactorSecretEncrypted,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    if (result.case === "PENDING_2FA") {
      return res.status(200).json({
        success: true,
        status: "PENDING_2FA",
        message: "Registration incomplete. Please configure 2FA.",
        tempToken: result.tempToken,
        qrCodeUrl: result.qrCodeUrl,
        manualSecret: result.manualSecret,
      });
    }

    if (result.case === "VERIFIED_NO_2FA") {
      res.cookie("token", result.authToken, COOKIE_OPTIONS);
      return res.status(200).json({
        success: true,
        message: "Login successful.",
        token: result.authToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role || "user",
          hasTwoFactor: !!result.user.twoFactorSecretEncrypted,
        },
      });
    }

    return res.status(200).json({
      email: result.email,
      name: result.name,
      success: true,
      status: "PENDING_2FA_VERIFICATION",
      message: "Password verified. Please enter 2FA verification code.",
      tempToken: result.tempToken,
    });
  } catch (error) {
    next(error);
  }
};

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
    const result = await authService.verify2FALogin({ code, token });
    res.cookie("token", result.authToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: result.authToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role || "user",
        hasTwoFactor: !!result.user.twoFactorSecretEncrypted,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Always return the same response to prevent user enumeration
    await authService.forgotPassword({ email });
    res.status(200).json({
      success: true,
      message:
        "If that email is registered, a password reset link has been sent to it.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword({ token, password });
    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  revokeSessionToken(req.headers['x-session-token']);
  removeLoggedOutUser(req.user.id);
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

const checkStatus = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const user = await authService.checkStatus({ token });
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. Sign in required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid authorization token." });
    }

    const db = await readDB();
    const user = getUserById(db, decoded.userId);

    if (!user || user.status !== "VERIFIED" || user.suspended || user.deletedAt) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    if (user.adminForceLoggedOutAt) {
      user.adminForceLoggedOutAt = null;
      await writeDB(db);
      return res.status(401).json({ success: false, message: "Logged out by administrator.", code: "FORCE_LOGOUT" });
    }

    if (user.pendingInactivityLogout && new Date(user.pendingInactivityLogout).getTime() <= Date.now()) {
      clearInactivityFlags(user);
      await writeDB(db);
      return res.status(401).json({ success: false, message: "Session expired due to inactivity.", code: "INACTIVITY_LOGOUT" });
    }

    if (user.pendingDeleteAt) {
      user.pendingDeleteAt = null;
      user.deleteToken = null;
      try { emitDeletionUpdate({ type: "cancelled", userId: user.id }); } catch (_) {}
      await writeDB(db);
    }

    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid authorization token." });
  }
};

const reactivateAccount = async (req, res, next) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ success: false, message: "Token and userId are required." });
    }
    await authService.reactivateAccount({ token, userId });
    res.status(200).json({
      success: true,
      message: "Account reactivated successfully. Please log in.",
    });
  } catch (err) {
    next(err);
  }
};

const getReactivateStatus = async (req, res, next) => {
  try {
    const { token, userId } = req.query;
    if (!token || !userId) {
      return res.status(400).json({ success: false, message: "Token and userId are required." });
    }
    const result = await authService.getReactivateStatus({ token, userId });
    res.status(200).json({
      success: true,
      name: result.name,
      remainingMs: result.remainingMs,
      expired: result.expired,
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        hasTwoFactor: !!user.twoFactorSecretEncrypted,
        suspended: user.suspended || false,
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

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await authService.updateProfile({ userId: req.user.id, name });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
    });
    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const generate2FASecret = async (req, res, next) => {
  try {
    const result = await authService.generate2FASecret({ userId: req.user.id });
    res.status(200).json({
      success: true,
      tempToken: result.tempToken,
      qrCodeUrl: result.qrCodeUrl,
      manualSecret: result.manualSecret,
    });
  } catch (error) {
    next(error);
  }
};

const enable2FA = async (req, res, next) => {
  try {
    const { code, tempToken } = req.body;
    const result = await authService.enable2FA({
      userId: req.user.id,
      code,
      tempToken,
    });
    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication enabled successfully.",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const { password } = req.body;
    const result = await authService.disable2FA({
      userId: req.user.id,
      password,
    });
    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication disabled successfully.",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const ping = async (req, res, next) => {
  try {
    await authService.ping({ userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const stayActive = async (req, res, next) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ success: false, message: "Token and userId are required." });
    }
    const result = await authService.stayActive({ token, userId });
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

const getInactivityStatus = async (req, res, next) => {
  try {
    const { token, userId } = req.query;
    if (!token || !userId) {
      return res.status(400).json({ success: false, message: "Token and userId are required." });
    }
    const result = await authService.getInactivityStatus({ token, userId });
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
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
};
