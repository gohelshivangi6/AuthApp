const fs = require('fs');
const path = require('path');

const EMAIL_FILE = path.join(__dirname, '..', 'data', 'emails.json');

// Ensure directory exists
const dir = path.dirname(EMAIL_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Simulates sending an email by appending it to a local JSON file.
 * Keeps only the last 50 emails to prevent resource exhaustion.
 */
async function sendEmail({ to, subject, text, html }) {
  const newEmail = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    to,
    subject,
    text,
    html,
    timestamp: new Date().toISOString()
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

    // Insert new email at the top
    emails.unshift(newEmail);

    // Slice to keep only last 50
    if (emails.length > 50) {
      emails = emails.slice(0, 50);
    }

    await fs.promises.writeFile(EMAIL_FILE, JSON.stringify(emails, null, 2), 'utf8');
    console.log(`[Simulated Email Sent] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error('Failed to write simulated email to file:', error);
    // Even if writing to file fails, do not crash the app, just log to console
    return false;
  }
}

/**
 * Utility to fetch all logged emails (dev utility).
 */
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

/**
 * Utility to clear all logged emails (dev utility).
 */
async function clearEmails() {
  try {
    await fs.promises.writeFile(EMAIL_FILE, JSON.stringify([], null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to clear emails:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  getEmails,
  clearEmails
};
