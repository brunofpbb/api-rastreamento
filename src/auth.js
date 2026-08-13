const crypto = require('crypto');
const config = require('./config');

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function readBasicAuthorization(req) {
  const header = String(req.headers.authorization || '');
  if (!header.toLowerCase().startsWith('basic ')) return null;

  try {
    const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
      source: 'basic'
    };
  } catch {
    return null;
  }
}

function readWsseHeaders(req) {
  const username = req.headers['x-wsse-username'];
  const password = req.headers['x-wsse-password'];
  if (username == null || password == null) return null;
  return { username: String(username), password: String(password), source: 'wsse-headers' };
}

function getCredentials(req) {
  return readWsseHeaders(req) || readBasicAuthorization(req);
}

function authenticate(req) {
  if (!config.auth.enabled) {
    return { ok: true, mode: 'disabled' };
  }

  const credentials = getCredentials(req);
  if (!credentials) {
    return { ok: false, reason: 'missing_credentials' };
  }

  const valid = safeEqual(credentials.username, config.auth.username)
    && safeEqual(credentials.password, config.auth.password);

  if (!valid) {
    return { ok: false, reason: 'invalid_credentials' };
  }

  return { ok: true, mode: credentials.source, username: credentials.username };
}

module.exports = { authenticate };
