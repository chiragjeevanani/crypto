const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/admin/dashboardController");

router.get("/stats", dashboardController.getDashboardStats);
router.get("/financials", dashboardController.getFinancialStats);
router.get("/transactions", dashboardController.getTransactions);


module.exports = router;
