const { decryptData } = require('./encryption');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validTokens = new Set();
const blacklistedNonces = new Set();

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function sessionToken(req, res, next) {
  const header = req.headers['x-session-token'];
<<<<<<< HEAD
  console.log("header", header);
  
=======
>>>>>>> 4bd405fe8739ac39179a75b73d46cc98e0519ee7
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

  req.sessionNonce = payload.nonce;
<<<<<<< HEAD
  console.log("session ", req.sessionNonce);
=======
>>>>>>> 4bd405fe8739ac39179a75b73d46cc98e0519ee7
  next();
}

function registerToken(nonce) {
  if (nonce) validTokens.add(nonce);
}

function removeToken(nonce) {
  validTokens.delete(nonce);
  if (nonce) blacklistedNonces.add(nonce);
}

<<<<<<< HEAD
function isTokenValid(nonce) {
  console.log("none", nonce);
  console.log("valid tokens ", validTokens);
  console.log("blacklist", blacklistedNonces);
  return validTokens.has(nonce);
}

module.exports = { sessionToken, registerToken, removeToken, isTokenValid };
=======
function requireRegisteredToken(req, res, next) {
  if (!req.sessionNonce || !validTokens.has(req.sessionNonce)) {
    return res.status(401).json({ error: 'Session expired. Please refresh the page.' });
  }
  next();
}

function isTokenValid(nonce) {
  return validTokens.has(nonce);
}

module.exports = { sessionToken, registerToken, removeToken, requireRegisteredToken, isTokenValid };
>>>>>>> 4bd405fe8739ac39179a75b73d46cc98e0519ee7
