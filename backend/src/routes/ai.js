const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { verifyJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/ai/estimate
 * Returns an AI-generated price estimate in INR for a transport job.
 * Gemini API is called backend-only — key never reaches the browser.
 * Validates: Requirements 12.1, 12.3, 12.4
 */
router.post('/estimate', verifyJWT, requireRole('customer', 'staff'), async (req, res) => {
  const { pickup, dropoff, goods_type, weight_kg } = req.body;

  if (!pickup || !dropoff || !goods_type || weight_kg == null) {
    return res.status(400).json({ error: 'pickup, dropoff, goods_type, and weight_kg are required' });
  }

  const prompt = `You are a transport pricing assistant for India.
Estimate the transport cost in INR for:
- Pickup: ${pickup}
- Dropoff: ${dropoff}
- Goods type: ${goods_type}
- Weight: ${weight_kg} kg
Respond with a price range like: "Estimated cost: \u20B9X,XXX \u2013 \u20B9X,XXX"`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Parse INR range — Req 12.4: return nulls on failure, never throw
    const match = rawResponse.match(/\u20B9([\d,]+)\s*[\u2013-]\s*\u20B9([\d,]+)/);
    if (match) {
      const min_price = parseInt(match[1].replace(/,/g, ''), 10);
      const max_price = parseInt(match[2].replace(/,/g, ''), 10);
      return res.json({ min_price, max_price, raw_response: rawResponse });
    }

    return res.json({ min_price: null, max_price: null, raw_response: rawResponse });
  } catch (err) {
    console.error('AI estimate error:', err);
    return res.json({ min_price: null, max_price: null, raw_response: String(err.message) });
  }
});

/**
 * POST /api/ai/route
 * Returns an AI-generated route suggestion with distance and travel time.
 * Validates: Requirements 12.2, 12.3
 */
router.post('/route', verifyJWT, requireRole('staff'), async (req, res) => {
  const { pickup, dropoff } = req.body;

  if (!pickup || !dropoff) {
    return res.status(400).json({ error: 'pickup and dropoff are required' });
  }

  const prompt = `You are a route planning assistant for India.
Provide a route suggestion for:
- From: ${pickup}
- To: ${dropoff}
Respond with estimated distance in km and travel time.`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    const distMatch = rawResponse.match(/(\d+(?:\.\d+)?)\s*km/i);
    const hourMatch = rawResponse.match(/(\d+(?:\.\d+)?)\s*hour/i);
    const minMatch = rawResponse.match(/(\d+)\s*min/i);

    const distance_km = distMatch ? parseFloat(distMatch[1]) : null;
    let travel_time = null;
    if (hourMatch) {
      travel_time = `${hourMatch[1]} hour${parseFloat(hourMatch[1]) !== 1 ? 's' : ''}`;
    } else if (minMatch) {
      travel_time = `${minMatch[1]} min`;
    }

    return res.json({ distance_km, travel_time, raw_response: rawResponse });
  } catch (err) {
    console.error('AI route error:', err);
    return res.json({ distance_km: null, travel_time: null, raw_response: String(err.message) });
  }
});

module.exports = router;
