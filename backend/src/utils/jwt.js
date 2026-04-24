const jwt = require('jsonwebtoken');

function ensureSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing.');
  }
}

function signToken(userId) {
  ensureSecret();

  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  ensureSecret();
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
