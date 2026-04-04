const mongoose = require("mongoose");

const SubcategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true, _id: true });

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    subcategories: [SubcategorySchema]
  },
  { timestamps: true }
);

// Slug auto-generation logic can be handled in controller or a pre-save hook
module.exports = mongoose.model("Category", CategorySchema);
