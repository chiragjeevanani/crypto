const express = require("express");
const { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  addSubcategory, 
  updateSubcategory, 
  deleteSubcategory 
} = require("../../controllers/admin/categoryController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

const adminRoles = ["super_admin", "Admin", "Developer", "SuperNode"];

router.get("/", getCategories);
router.post("/", protect, authorize(...adminRoles), createCategory);
router.patch("/:id", protect, authorize(...adminRoles), updateCategory);
router.delete("/:id", protect, authorize(...adminRoles), deleteCategory);

// Subcategory routes
router.post("/:categoryId/sub", protect, authorize(...adminRoles), addSubcategory);
router.patch("/:categoryId/sub/:subId", protect, authorize(...adminRoles), updateSubcategory);
router.delete("/:categoryId/sub/:subId", protect, authorize(...adminRoles), deleteSubcategory);

module.exports = router;
