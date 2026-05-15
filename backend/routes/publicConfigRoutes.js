const express = require("express");
const axios = require("axios");
const { getConfig } = require("../controllers/admin/configAdminController");

const router = express.Router();

// Simple in-memory cache for MATIC price
let cachedMaticPrice = {
  price: 7, // Default fallback (₹7 per MATIC)
  lastUpdated: 0
};

// Route to get real-time MATIC price in INR
router.get("/matic-price", async (req, res) => {
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();

  if (now - cachedMaticPrice.lastUpdated < CACHE_DURATION) {
    return res.json({ success: true, price: cachedMaticPrice.price, source: "cache" });
  }

  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=inr"
    );
    
    if (response.data["matic-network"] && response.data["matic-network"].inr) {
      cachedMaticPrice.price = response.data["matic-network"].inr;
      cachedMaticPrice.lastUpdated = now;
      return res.json({ success: true, price: cachedMaticPrice.price, source: "api" });
    }
    
    throw new Error("Invalid response structure from CoinGecko");
  } catch (err) {
    console.error("Failed to fetch MATIC price from CoinGecko:", err.message);
    // Return cached price (even if old) as fallback
    res.json({ success: true, price: cachedMaticPrice.price, source: "fallback" });
  }
});

// Public route to get platform settings
router.get("/", getConfig);

module.exports = router;
