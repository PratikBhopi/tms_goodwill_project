module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, error: 'Record already exists' });
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
};
