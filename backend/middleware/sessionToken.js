const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validTokens = new Set();

function sessionToken(req, res, next) {
  const token = req.headers['x-session-token'];

  if (!token || !uuidRegex.test(token)) {
    return res.status(401).json({ error: 'Invalid or missing session token' });
  }

  req.sessionToken = token;
  next();
}

function registerToken(token) {
  if (token) validTokens.add(token);
}

function removeToken(token) {
  validTokens.delete(token);
}

function requireRegisteredToken(req, res, next) {
  if (!req.sessionToken || !validTokens.has(req.sessionToken)) {
    return res.status(401).json({ error: 'Session expired. Please refresh the page.' });
  }
  next();
}

function isTokenValid(token) {
  return validTokens.has(token);
}

module.exports = { sessionToken, registerToken, removeToken, requireRegisteredToken, isTokenValid };
