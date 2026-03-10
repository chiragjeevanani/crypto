const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { listUsers, getUserDetail } = require("../../controllers/admin/userAdminController");

const router = express.Router();

// Only admin roles can see/manage users
router.get(
  "/",
  protect,
  authorize("SuperNode", "Admin", "super_admin", "Developer"),
  listUsers
);

router.get(
  "/:id",
  protect,
  authorize("SuperNode", "Admin", "super_admin", "Developer"),
  getUserDetail
);

module.exports = router;

