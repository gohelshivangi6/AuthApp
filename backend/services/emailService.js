const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const EMAIL_FILE = path.join(__dirname, '..', 'data', 'emails.json');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const dir = path.dirname(EMAIL_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let transporter = null;
let warned = false;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (!warned) {
      console.warn('[EmailService] SMTP not configured.');
      warned = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const newEmail = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    to,
    subject,
    text,
    html,
    timestamp: new Date().toISOString(),
  };

  try {
    let emails = [];
    if (fs.existsSync(EMAIL_FILE)) {
      try {
        const fileContent = await fs.promises.readFile(EMAIL_FILE, 'utf8');
        emails = JSON.parse(fileContent);
        if (!Array.isArray(emails)) emails = [];
      } catch (err) {
        console.error('Error reading emails.json, starting fresh:', err);
      }
    }

    emails.unshift(newEmail);
    if (emails.length > 50) {
      emails = emails.slice(0, 50);
    }

    await fs.promises.writeFile(EMAIL_FILE, JSON.stringify(emails, null, 2), 'utf8');
    console.log(`[Simulated Email Sent] To: ${to} | Subject: ${subject}`);

    const transport = getTransporter();
    if (transport) {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@authapp.com';
      transport.sendMail({ from, to, subject, text, html }).catch(() => {});
    }

    return true;
  } catch (error) {
    console.error('Failed to write simulated email to file:', error);
    return false;
  }
}

async function getEmails() {
  try {
    if (!fs.existsSync(EMAIL_FILE)) return [];
    const fileContent = await fs.promises.readFile(EMAIL_FILE, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Failed to read simulated emails:', error);
    return [];
  }
}

async function clearEmails() {
  try {
    await fs.promises.writeFile(EMAIL_FILE, JSON.stringify([], null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to clear emails:', error);
    return false;
  }
}

function sendPasswordResetEmail(user, resetToken) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  return sendEmail({
    to: user.email,
    subject: "SecureAuthApp - Password Reset Request",
    text: `Hello ${user.name},\n\nYou requested a password reset. Reset your password here:\n${resetLink}\n\nThis link will expire in 15 minutes.`,
    html: `<p>Hello ${user.name},</p><p>You requested a password reset. Reset your password by clicking the link below:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link will expire in 15 minutes.</p>`,
  });
}

function sendPasswordChangedEmail(user) {
  return sendEmail({
    to: user.email,
    subject: "SecureAuthApp - Password Changed successfully",
    text: `Hello ${user.name},\n\nYour account password has been successfully updated. If you did not make this change, contact us immediately.`,
    html: `<p>Hello ${user.name},</p><p>Your account password has been successfully updated. If you did not make this change, contact us immediately.</p>`,
  });
}

function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: "Welcome to SecureAuthApp - Finish 2FA Registration",
    text: `Hello ${user.name},\n\nPlease complete your registration by configuring Two-Factor Authentication. Log in to your account and follow the setup instructions to scan the QR code with your authenticator app.`,
    html: `<p>Hello ${user.name},</p><p>Please complete your registration by configuring Two-Factor Authentication.</p><p>Log in to your account and follow the setup instructions to scan the QR code with your authenticator app.</p>`,
  });
}

function sendInactivityWarningEmail(user, token) {
  const stayActiveLink = `${FRONTEND_URL}/stay-active?token=${token}&userId=${user.id}`;
  return sendEmail({
    to: user.email,
    subject: 'Are you still there?',
    text: `Hello ${user.name},\n\nYou've been inactive for 15 minutes. If you want to stay logged in, click the link below within 2 minutes:\n\n${stayActiveLink}\n\nIf you do not respond, you will be automatically logged out.`,
    html: `<p>Hello ${user.name},</p><p>You've been inactive for 15 minutes.</p><p><a href="${stayActiveLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Stay Active</a></p><p>If you do not respond within <strong>2 minutes</strong>, you will be automatically logged out.</p>`,
  });
}

function sendForceLogoutEmail(user) {
  const loginLink = `${FRONTEND_URL}/login`;
  return sendEmail({
    to: user.email,
    subject: 'You have been logged out by an administrator',
    text: `Hello ${user.name},\n\nAn administrator has logged you out. You can log back in at: ${loginLink}`,
    html: `<p>Hello ${user.name},</p><p>An administrator has logged you out.</p><p><a href="${loginLink}">Click here to log back in</a></p>`,
  });
}

async function verifyTransporter() {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[EmailService] SMTP not configured — real emails disabled. Set SMTP_* in .env to enable.');
    return;
  }
  try {
    await transport.verify();
    console.log('[EmailService] SMTP connection verified — ready to send real emails.');
  } catch (error) {
    console.error('[EmailService] SMTP verification failed:', error.message);
  }
}

module.exports = {
  sendEmail,
  getEmails,
  clearEmails,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  sendInactivityWarningEmail,
  sendForceLogoutEmail,
  verifyTransporter,
};