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

// const { webcrypto } = require("crypto");

// const SECRET_KEY = process.env.SECRET_KEY;

// async function getKey() {
//   return webcrypto.subtle.importKey(
//     "raw",
//     new TextEncoder().encode(SECRET_KEY),
//     { name: "AES-GCM" },
//     false,
//     ["encrypt", "decrypt"]
//   );
// }

// function toBase64(buffer) {
//   return Buffer.from(buffer).toString("base64");
// }

// async function encryptData(data) {
//   const key = await getKey();

//   const iv = webcrypto.getRandomValues(new Uint8Array(12));

//   const encrypted = await webcrypto.subtle.encrypt(
//     {
//       name: "AES-GCM",
//       iv,
//     },
//     key,
//     new TextEncoder().encode(JSON.stringify(data))
//   );

//   return {
//     encryptedData: toBase64(encrypted),
//     iv: toBase64(iv),
//   };
// }

// module.exports = { encryptData };