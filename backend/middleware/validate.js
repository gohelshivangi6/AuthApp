const { body, validationResult } = require('express-validator');

// List of common disposable email domains to block spam registrations
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  'guerrillamail.com',
  'trashmail.com',
  '10minutemail.com',
  'dispostable.com',
  'getairmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz'
]);

/**
 * Custom validator to check for disposable email domains.
 */
const checkDisposableEmail = (email) => {
  if (!email) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw new Error('Registration from disposable email domains is not allowed.');
  }
  return true;
};

/**
 * Honeypot middleware.
 * If the hidden 'website' field is populated (which bots do but normal users don't),
 * we pretend the signup was successful to confuse the spammer while doing absolutely nothing on the backend.
 */
const checkHoneypot = (req, res, next) => {
  if (req.body.website) {
    console.warn(`Spam bot signup attempt blocked via Honeypot field (value: ${req.body.website}) from IP: ${req.ip}`);
    // Respond with a fake success
    return res.status(201).json({
      success: true,
      message: 'Signup successful. Please configure Two-Factor Authentication.',
      devNote: 'Honeypot triggered, action was ignored.',
      token: 'fake-token-for-spambot'
    });
  }
  next();
};

/**
 * Validator arrays for endpoints.
 */
const validateSignup = [
  checkHoneypot,
  body('email')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail()
    .custom(checkDisposableEmail),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character.'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters.')
];

const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail()
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character.')
];

const validate2FA = [
  body('code')
    .isNumeric().withMessage('Verification code must contain only numbers.')
    .isLength({ min: 6, max: 6 }).withMessage('Verification code must be exactly 6 digits.')
];

/**
 * Middleware to intercept validation errors and respond with a 400 Bad Request.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // Return the first error message for simplicity and cleaner UI
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validate2FA,
  handleValidationErrors
};
