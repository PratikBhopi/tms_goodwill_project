const gemini = require('../services/gemini.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getRouteSuggestion = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return sendError(res, 400, 'from and to are required');
    const suggestion = await gemini.getRouteSuggestion(from, to);
    sendSuccess(res, { suggestion });
  } catch (err) { next(err); }
};

exports.getPriceEstimate = async (req, res, next) => {
  try {
    const { from, to, weightKg, goodsType } = req.query;
    const estimate = await gemini.getPriceEstimate({ from, to, weightKg, goodsType });
    sendSuccess(res, { estimate });
  } catch (err) { next(err); }
};
