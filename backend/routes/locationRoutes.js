const express = require("express");
const { 
  getCountries, 
  getStatesByCountry,
  saveCountry,
  deleteCountry,
  addState,
  deleteState
} = require("../controllers/locationController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/countries", getCountries);
router.get("/states/:countryCode", getStatesByCountry);

// Admin routes
router.post("/admin/country", protect, authorize("SuperAdmin", "Admin", "SuperNode"), saveCountry);
router.delete("/admin/country/:code", protect, authorize("SuperAdmin", "Admin", "SuperNode"), deleteCountry);
router.post("/admin/state", protect, authorize("SuperAdmin", "Admin", "SuperNode"), addState);
router.delete("/admin/state/:id", protect, authorize("SuperAdmin", "Admin", "SuperNode"), deleteState);

module.exports = router;
