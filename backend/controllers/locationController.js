const Country = require("../models/Country");
const State = require("../models/State");

/**
 * Get all available countries
 */
const getCountries = async (req, res) => {
  try {
    let countries = await Country.find({}).sort({ name: 1 });
    
    // Auto-seed if empty
    if (countries.length === 0) {
      console.log("[Location] No countries found, auto-seeding...");
      const initialCountries = [
        { name: "India", code: "IN", currencyCode: "INR", currencySymbol: "₹", flag: "🇮🇳" },
        { name: "United States", code: "US", currencyCode: "USD", currencySymbol: "$", flag: "🇺🇸" },
        { name: "United Kingdom", code: "UK", currencyCode: "GBP", currencySymbol: "£", flag: "🇬🇧" },
        { name: "Eurozone", code: "EU", currencyCode: "EUR", currencySymbol: "€", flag: "🇪🇺" },
        { name: "UAE", code: "AE", currencyCode: "AED", currencySymbol: "AED", flag: "🇦🇪" },
        { name: "Oman", code: "OM", currencyCode: "OMR", currencySymbol: "OMR", flag: "🇴🇲" },
        { name: "Jordan", code: "JO", currencyCode: "JOD", currencySymbol: "JOD", flag: "🇯🇴" },
        { name: "Switzerland", code: "CH", currencyCode: "CHF", currencySymbol: "CHF", flag: "🇨🇭" },
        { name: "Canada", code: "CA", currencyCode: "CAD", currencySymbol: "$", flag: "🇨🇦" },
        { name: "Australia", code: "AU", currencyCode: "AUD", currencySymbol: "$", flag: "🇦🇺" },
        { name: "Singapore", code: "SG", currencyCode: "SGD", currencySymbol: "$", flag: "🇸🇬" },
        { name: "Russia", code: "RU", currencyCode: "RUB", currencySymbol: "₽", flag: "🇷🇺" },
        { name: "France", code: "FR", currencyCode: "EUR", currencySymbol: "€", flag: "🇫🇷" },
      ];
      await Country.insertMany(initialCountries);
      
      const initialStates = [
        { name: "Maharashtra", countryCode: "IN" }, { name: "Delhi", countryCode: "IN" },
        { name: "California", countryCode: "US" }, { name: "New York", countryCode: "US" },
        { name: "England", countryCode: "UK" }, { name: "Ontario", countryCode: "CA" }
      ];
      await State.insertMany(initialStates);
      
      countries = await Country.find({}).sort({ name: 1 });
    }

    res.status(200).json({ success: true, countries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get states for a specific country code
 */
const getStatesByCountry = async (req, res) => {
  try {
    const { countryCode } = req.params;
    if (!countryCode) {
      return res.status(400).json({ success: false, message: "Country code is required" });
    }

    const states = await State.find({ countryCode: countryCode.toUpperCase() }).sort({ name: 1 });
    res.status(200).json({ success: true, states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCountries,
  getStatesByCountry
};
