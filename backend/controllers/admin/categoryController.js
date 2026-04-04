const Category = require("../../models/Category");

const generateSlug = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

exports.getCategories = async (req, res) => {
  try {
    const list = await Category.find().sort({ displayOrder: 1, name: 1 });
    return res.status(200).json({ success: true, categories: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;
    const slug = generateSlug(name);
    const exists = await Category.findOne({ slug });
    if (exists) return res.status(400).json({ success: false, message: "Category already exists" });

    const cat = await Category.create({ name, slug, displayOrder: displayOrder || 0 });
    return res.status(201).json({ success: true, category: cat });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, isActive, displayOrder } = req.body;
    const updates = { isActive };
    if (name) {
      updates.name = name;
      updates.slug = generateSlug(name);
    }
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;

    const updated = await Category.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    return res.status(200).json({ success: true, category: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Category removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addSubcategory = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;
    const { categoryId } = req.params;
    const subSlug = generateSlug(name);

    const updated = await Category.findByIdAndUpdate(
      categoryId,
      { $push: { subcategories: { name, slug: subSlug, displayOrder: displayOrder || 0 } } },
      { new: true }
    );
    return res.status(200).json({ success: true, category: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { name, isActive, displayOrder } = req.body;
    const { categoryId, subId } = req.params;
    
    // Find category to check for subcategory
    const cat = await Category.findById(categoryId);
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });

    const updates = {};
    if (name) {
      updates["subcategories.$.name"] = name;
      updates["subcategories.$.slug"] = generateSlug(name);
    }
    if (isActive !== undefined) updates["subcategories.$.isActive"] = isActive;
    if (displayOrder !== undefined) updates["subcategories.$.displayOrder"] = displayOrder;

    const updated = await Category.findOneAndUpdate(
      { _id: categoryId, "subcategories._id": subId },
      { $set: updates },
      { new: true }
    );
    return res.status(200).json({ success: true, category: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { categoryId, subId } = req.params;
    const updated = await Category.findByIdAndUpdate(
      categoryId,
      { $pull: { subcategories: { _id: subId } } },
      { new: true }
    );
    return res.status(200).json({ success: true, category: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
