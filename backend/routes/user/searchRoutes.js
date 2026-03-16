const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { search } = require("../../controllers/user/searchController");

const router = express.Router();

router.get("/", protect, search);

module.exports = router;
