// Basic fallback pricing logic if Gemini fails or for sync responses.
exports.estimate = async ({ pickupAddress, dropoffAddress, weightKg }) => {
    // Basic mockup distance estimation (would ideally use Google Maps Distance Matrix)
    const basePrice = 500;
    const weightFactor = weightKg * 1.5; 
    const distanceAssumed = 20; // assumed km
    const distanceFactor = distanceAssumed * 15;
    
    return basePrice + weightFactor + distanceFactor;
};
