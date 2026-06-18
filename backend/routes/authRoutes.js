const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/authController');

const {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validate2FA,
  handleValidationErrors,
  validateUpdateProfile,
  validateChangePassword,
} = require('../middleware/validate');

const {
  authLimiter,
  passwordResetLimiter
} = require('../middleware/rateLimit');

const { getEmails, clearEmails } = require('../utils/mailer');
const { sessionToken } = require('../middleware/sessionToken');

// --- Auth Routes ---
router.post('/signup', authLimiter, validateSignup, handleValidationErrors, signup);
router.post('/verify-2fa-setup', authLimiter, validate2FA, handleValidationErrors, sessionToken, verify2FASetup);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/verify-2fa-login', authLimiter, validate2FA, handleValidationErrors, sessionToken, verify2FALogin);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateResetPassword, handleValidationErrors, resetPassword);
router.get('/me', requireAuth, me);
router.post('/logout', sessionToken, logout);
router.get('/status', checkStatus);

// --- Protected Dashboard Data Route ---
router.get('/dashboard-data', requireAuth, sessionToken, (req, res) => {
  res.status(200).json({
    success: true,
    secretMessage: 'Welcome to the inner sanctum. This data is cryptographically protected by double factors.',
    timestamp: new Date().toISOString(),
    sessionDetails: {
      userId: req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// --- Reactivate Account (from deletion email link) ---
router.post('/reactivate', reactivateAccount);

// --- Profile & Account Management ---
router.put('/profile', requireAuth, validateUpdateProfile, handleValidationErrors, updateProfile);
router.post('/change-password', requireAuth, validateChangePassword, handleValidationErrors, changePassword);

// --- Dev Utilities (Simulated Email Sandbox) ---
router.get('/dev/emails', async (req, res, next) => {
  try {
    const list = await getEmails();
    res.status(200).json({ success: true, emails: list });
  } catch (error) {
    next(error);
  }
});

router.post('/dev/emails/clear', async (req, res, next) => {
  try {
    await clearEmails();
    res.status(200).json({ success: true, message: 'Simulated mailbox cleared.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
