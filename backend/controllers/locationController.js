const Country = require("../models/Country");
const State = require("../models/State");

/**
 * Get all available countries with state counts
 */
const getCountries = async (req, res) => {
  try {
    const countries = await Country.find({}).sort({ name: 1 }).lean();
    
    // Get state counts for all countries in parallel
    const countriesWithCounts = await Promise.all(
      countries.map(async (c) => {
        const count = await State.countDocuments({ countryCode: c.code });
        return { ...c, stateCount: count };
      })
    );

    res.status(200).json({ success: true, countries: countriesWithCounts });
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

/**
 * Admin: Add or update a country
 */
const saveCountry = async (req, res) => {
  try {
    const { name, code, currencyCode, currencySymbol, flag, inrValue } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Name and code are required" });
    }

    const country = await Country.findOneAndUpdate(
      { code: code.toUpperCase() },
      { name, currencyCode, currencySymbol, flag, inrValue },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, country });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete a country and its states
 */
const deleteCountry = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: "Country code is required" });
    }
    const country = await Country.findOne({ code: code.toUpperCase() });
    
    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    await State.deleteMany({ countryCode: code.toUpperCase() });
    await Country.deleteOne({ _id: country._id });

    res.status(200).json({ success: true, message: "Country and associated states deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Add a state
 */
const addState = async (req, res) => {
  try {
    const { name, countryCode } = req.body;
    
    if (!name || !countryCode) {
      return res.status(400).json({ success: false, message: "Name and countryCode are required" });
    }

    const country = await Country.findOne({ code: countryCode.toUpperCase() });
    if (!country) {
      return res.status(404).json({ success: false, message: `Country with code '${countryCode}' not found` });
    }

    const state = await State.create({
      name,
      countryCode: countryCode.toUpperCase(),
      countryId: country._id
    });

    res.status(201).json({ success: true, state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete a state
 */
const deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    await State.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "State deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCountries,
  getStatesByCountry,
  saveCountry,
  deleteCountry,
  addState,
  deleteState
};
