const Gift = require("../../models/Gift");

const toAdminGift = (gift) => ({
  id: gift._id.toString(),
  name: gift.name,
  icon: gift.icon || "🎁",
  price: gift.price,
  value: gift.value,
  status: gift.status,
  usage: gift.usage || 0,
  deletedAt: gift.deletedAt
});

exports.listGifts = async (req, res) => {
  try {
    const gifts = await Gift.find({ status: { $ne: "Deleted" } })
      .sort({ createdAt: 1 })
      .exec();
    return res.status(200).json({
      success: true,
      gifts: gifts.map(toAdminGift)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.listTrashGifts = async (req, res) => {
  try {
    const gifts = await Gift.find({ status: "Deleted" })
      .sort({ deletedAt: -1 })
      .exec();
    return res.status(200).json({
      success: true,
      gifts: gifts.map(toAdminGift)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGift = async (req, res) => {
  try {
    const { name, price, icon, status } = req.body || {};
    const numericPrice = Math.max(0, Number(price || 0));
    if (!name || !Number.isFinite(numericPrice)) {
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    const gift = await Gift.create({
      name: String(name).trim(),
      icon: icon || "🎁",
      price: numericPrice,
      value: numericPrice,
      status: status || "Active"
    });

    return res.status(201).json({ success: true, gift: toAdminGift(gift) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGift = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, icon, status } = req.body || {};

    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (icon !== undefined) update.icon = icon || "🎁";
    if (price !== undefined) {
      const numericPrice = Math.max(0, Number(price || 0));
      update.price = numericPrice;
      update.value = numericPrice;
    }
    if (status !== undefined) update.status = status;

    const gift = await Gift.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!gift) {
      return res.status(404).json({ success: false, message: "Gift not found" });
    }

    return res.status(200).json({ success: true, gift: toAdminGift(gift) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteGift = async (req, res) => {
  try {
    const id = req.params.id;
    const gift = await Gift.findByIdAndUpdate(
      id,
      { status: "Deleted", deletedAt: new Date() },
      { new: true }
    ).exec();
    if (!gift) {
      return res.status(404).json({ success: false, message: "Gift not found" });
    }
    return res.status(200).json({ success: true, gift: toAdminGift(gift) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreGift = async (req, res) => {
  try {
    const id = req.params.id;
    const gift = await Gift.findByIdAndUpdate(
      id,
      { status: "Active", deletedAt: null },
      { new: true }
    ).exec();
    if (!gift) {
      return res.status(404).json({ success: false, message: "Gift not found" });
    }
    return res.status(200).json({ success: true, gift: toAdminGift(gift) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.permanentlyDeleteGift = async (req, res) => {
  try {
    const id = req.params.id;
    const gift = await Gift.findByIdAndDelete(id).exec();
    if (!gift) {
      return res.status(404).json({ success: false, message: "Gift not found" });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleGiftStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const gift = await Gift.findById(id).exec();
    if (!gift) {
      return res.status(404).json({ success: false, message: "Gift not found" });
    }
    if (gift.status === "Deleted") {
      return res.status(400).json({ success: false, message: "Cannot toggle a deleted gift" });
    }
    gift.status = gift.status === "Active" ? "Inactive" : "Active";
    await gift.save();
    return res.status(200).json({ success: true, gift: toAdminGift(gift) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

