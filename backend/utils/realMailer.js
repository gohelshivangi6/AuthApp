const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[RealMailer] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to send real emails.');
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

async function sendRealEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) return false;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@authapp.com';

  try {
    await transport.sendMail({ from, to, subject, text, html });
    console.log(`[RealMailer] Email sent to ${to} | Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error('[RealMailer] Failed to send email:', error.message);
    return false;
  }
}

module.exports = { sendRealEmail };
