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

  console.log("encrypted", encrypted);

  return {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

module.exports = {
  encryptData
};