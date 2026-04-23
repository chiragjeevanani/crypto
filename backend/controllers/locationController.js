const Country = require("../models/Country");
const State = require("../models/State");

/**
 * Get all available countries
 */
const getCountries = async (req, res) => {
  try {
    const countries = await Country.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, countries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get states for a specific country code or ID
 */
const getStatesByCountry = async (req, res) => {
  try {
    const { countryCode } = req.params;
    if (!countryCode) {
      return res.status(400).json({ success: false, message: "Country code or ID is required" });
    }

    let query = {};
    if (countryCode.length === 24) {
      // Treat as ObjectId
      query = { countryId: countryCode };
    } else {
      // Treat as Code
      query = { countryCode: countryCode.toUpperCase() };
    }

    const states = await State.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCountries,
  getStatesByCountry
};
