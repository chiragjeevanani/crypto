const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const {
  createStaffMember,
  listStaffMembers,
  getStaffMember,
  updateStaffMember,
  toggleStaffActive,
  deleteStaffMember,
} = require("../../controllers/admin/staffAdminController");

const router = express.Router();
const adminAuth = [protect, authorize("SuperNode", "Admin", "super_admin", "Developer")];

router.get("/",          ...adminAuth, listStaffMembers);
router.post("/",         ...adminAuth, createStaffMember);
router.get("/:id",       ...adminAuth, getStaffMember);
router.patch("/:id",     ...adminAuth, updateStaffMember);
router.patch("/:id/toggle", ...adminAuth, toggleStaffActive);
router.delete("/:id",    ...adminAuth, deleteStaffMember);

module.exports = router;
