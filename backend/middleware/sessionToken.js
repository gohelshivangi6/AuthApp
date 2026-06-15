const { decryptData } = require('./encryption');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validTokens = new Set();
const blacklistedNonces = new Set();
let currentToken = null;

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function sessionToken(req, res, next) {
  const header = req.headers['x-session-token'];
  console.log("header", header);
  
  if (!header) {
    return res.status(401).json({ error: 'Missing session token' });
  }

  const parts = header.split(':');
  if (parts.length !== 3) {
    return res.status(401).json({ error: 'Invalid session token format' });
  }

  const [iv, authTag, encryptedData] = parts;

  let payload;
  try {
    payload = decryptData(encryptedData, iv, authTag);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or tampered session token' });
  }

  if (!payload.nonce || !uuidRegex.test(payload.nonce)) {
    return res.status(401).json({ error: 'Invalid session token payload' });
  }

  if (blacklistedNonces.has(payload.nonce)) {
    return res.status(401).json({ error: 'Session token has been revoked' });
  }

  const age = Date.now() - payload.time;
  if (Math.abs(age) > TOKEN_TTL_MS) {
    return res.status(401).json({ error: 'Session token expired' });
  }

  // req.sessionNonce = payload.nonce;
  // currentToken = payload.nonce;
  console.log("session ", req.sessionNonce);
  next();
}

// function registerToken(nonce) {
//   if (nonce) {
//     validTokens.add(nonce);
//     currentToken = nonce;
//   }
// }

// function removeToken(nonce) {
//   validTokens.delete(nonce);
//   if (nonce) blacklistedNonces.add(nonce);
// }

// function isTokenValid(nonce) {
//   console.log("none", nonce);
//   console.log("valid tokens ", validTokens);
//   console.log("blacklist", blacklistedNonces);
//   console.log("current token ", currentToken);
//   // return validTokens.has(nonce);
//   console.log("true or false ", currentToken == nonce)
//   return currentToken == nonce;
// }

module.exports = { sessionToken };
