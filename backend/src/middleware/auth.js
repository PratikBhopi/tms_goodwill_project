const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT token from the Authorization header.
 * On success, attaches the decoded payload (userId, role) to req.user.
 * Validates: Requirements 13.2, 13.5
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * Returns middleware that restricts access to users with one of the allowed roles.
 * Assumes verifyJWT has already run and req.user is set.
 * Validates: Requirements 13.2, 13.6
 *
 * @param {...string} roles - Allowed roles (e.g. 'staff', 'owner', 'driver', 'customer')
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { verifyJWT, requireRole };
