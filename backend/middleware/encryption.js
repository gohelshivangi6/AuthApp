const crypto = require('crypto');

function encryptData(data) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    process.env.SECRET_KEY,
    iv
  );

  let encrypted = cipher.update(
    JSON.stringify(data),
    'utf8'
  );

  encrypted = Buffer.concat([
    encrypted,
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

function decryptData(encryptedBase64, ivBase64, authTagBase64) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    process.env.SECRET_KEY,
    Buffer.from(ivBase64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

module.exports = {
  encryptData,
  decryptData
};