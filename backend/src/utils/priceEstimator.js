/**
 * Price Estimator utility
 * Calculates estimated transport price based on distance and weight.
 * Validates: Requirements 2.2, 2.6
 */

// Fixed distance lookup table (km) for demo address pairs
const DISTANCE_TABLE = {
  'Mumbai|Pune': 150,
  'Pune|Mumbai': 150,
  'Mumbai|Nashik': 170,
  'Nashik|Mumbai': 170,
  'Pune|Nashik': 210,
  'Nashik|Pune': 210,
  'Mumbai|Aurangabad': 335,
  'Aurangabad|Mumbai': 335,
  'Pune|Aurangabad': 235,
  'Aurangabad|Pune': 235,
};

const DEFAULT_DISTANCE_KM = 100;

/**
 * Estimates the transport price.
 * Formula: (distance_km * 10) + (weight_kg * 5)
 *
 * @param {string} pickupAddress
 * @param {string} dropoffAddress
 * @param {number} weightKg
 * @returns {number} estimated price (minimum 1)
 */
function estimatePrice(pickupAddress, dropoffAddress, weightKg) {
  const key = `${pickupAddress}|${dropoffAddress}`;
  const distance = DISTANCE_TABLE[key] ?? DEFAULT_DISTANCE_KM;
  const price = distance * 10 + weightKg * 5;
  return Math.max(1, price);
}

module.exports = { estimatePrice };
