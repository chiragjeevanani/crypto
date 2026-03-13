const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const {
  listGifts,
  listTrashGifts,
  createGift,
  updateGift,
  softDeleteGift,
  restoreGift,
  permanentlyDeleteGift,
  toggleGiftStatus
} = require("../../controllers/admin/giftAdminController");

const router = express.Router();

const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];
const adminAuth = [protect, authorize(...adminRoles)];

router.get("/", ...adminAuth, listGifts);
router.get("/trash", ...adminAuth, listTrashGifts);
router.post("/", ...adminAuth, createGift);
router.patch("/:id", ...adminAuth, updateGift);
router.delete("/:id", ...adminAuth, softDeleteGift);
router.post("/:id/restore", ...adminAuth, restoreGift);
router.delete("/:id/permanent", ...adminAuth, permanentlyDeleteGift);
router.post("/:id/toggle", ...adminAuth, toggleGiftStatus);

module.exports = router;

