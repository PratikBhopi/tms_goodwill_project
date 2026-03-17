const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, 401, 'No token provided');
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name }
    next();
  } catch {
    return sendError(res, 401, 'Invalid or expired token');
  }
};
