const axios = require("axios");

let cachedRates = null;
let lastFetchTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

/**
 * GET /api/currency/rates
 * Fetches live currency exchange rates (base INR) and caches them.
 */
const getCurrencyRates = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
      return res.status(200).json({ success: true, rates: cachedRates, source: "cache" });
    }

    // Using a free API (e.g. open.er-api.com, no auth required, Base USD usually, so we fetch and convert to INR base)
    const response = await axios.get("https://open.er-api.com/v6/latest/INR");
    if (response.data && response.data.rates) {
      cachedRates = response.data.rates;
      lastFetchTime = now;
      return res.status(200).json({ success: true, rates: cachedRates, source: "api" });
    }

    // Fallback if API fails and no cache
    if (cachedRates) {
      return res.status(200).json({ success: true, rates: cachedRates, source: "cache-stale" });
    }

    res.status(500).json({ success: false, message: "Could not fetch exchange rates." });
  } catch (err) {
    console.error("[Currency API] error:", err.message);
    if (cachedRates) {
      return res.status(200).json({ success: true, rates: cachedRates, source: "cache-stale" });
    }
    // Hardcoded fallback for common currencies relative to 1 INR
    const fallbackRates = {
      INR: 1,
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0094,
    };
    res.status(200).json({ success: true, rates: fallbackRates, source: "fallback" });
  }
};

module.exports = {
  getCurrencyRates,
};
