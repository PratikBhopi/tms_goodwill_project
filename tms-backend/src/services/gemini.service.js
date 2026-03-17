const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

exports.getRouteSuggestion = async (from, to) => {
  const prompt = `
    You are a logistics assistant for a transport company in India.
    A delivery needs to go from: "${from}" to: "${to}".
    Suggest the best road route in 1 short sentence.
    Include approximate distance in km and time.
    Reply in plain text only, no markdown.
  `;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

exports.getPriceEstimate = async ({ from, to, weightKg, goodsType }) => {
  const prompt = `
    You are a pricing assistant for a small transport business in India (FMCG distribution).
    Estimate a fair transport price for:
    - Pickup: ${from}
    - Drop-off: ${to}
    - Goods: ${goodsType}
    - Weight: ${weightKg} kg
    Reply with ONLY a JSON object like: { "min": 1800, "max": 2400, "currency": "INR" }
    No explanation, no markdown.
  `;
  const result  = await model.generateContent(prompt);
  const text    = result.response.text().trim();
  try {
    return JSON.parse(text);
  } catch {
    return { min: null, max: null, note: text };
  }
};
