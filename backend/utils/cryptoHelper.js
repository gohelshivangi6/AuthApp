const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Load encryption key from environment or fallback to a default key for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
  : crypto.scryptSync('default_secure_passphrase_for_dev_only', 'salt', 32);

const IV_LENGTH = 16; // For AES-256-CBC

/**
 * Hashes a plaintext password using bcrypt.
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plaintext password with a bcrypt hash.
 */
async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Encrypts cleartext using AES-256-CBC.
 * Returns a hex-encoded string containing the iv and encrypted content.
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts an AES-256-CBC encrypted hex-string.
 */
function decrypt(text) {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed, returning null:', error.message);
    return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt
};
