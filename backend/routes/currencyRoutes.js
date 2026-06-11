const express = require("express");
const router = express.Router();
const { getCurrencyRates } = require("../controllers/currencyController");

// Public route to fetch currency exchange rates
router.get("/rates", getCurrencyRates);

module.exports = router;
