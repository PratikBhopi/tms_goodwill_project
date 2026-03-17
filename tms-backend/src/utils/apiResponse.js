exports.sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

exports.sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, error: message });
};
