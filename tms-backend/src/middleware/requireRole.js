const { sendError } = require('../utils/apiResponse');

module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Access denied');
    }
    next();
  };
};
