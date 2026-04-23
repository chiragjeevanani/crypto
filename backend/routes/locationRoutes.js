const express = require("express");
const { getCountries, getStatesByCountry } = require("../controllers/locationController");

const router = express.Router();

router.get("/countries", getCountries);
router.get("/states/:countryCode", getStatesByCountry);

module.exports = router;
