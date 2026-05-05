const Gift = require("../../models/Gift");

const toAdminGift = (gift) => ({
  id: gift._id.toString(),
  name: gift.name,
  icon: gift.icon || "🎁",
  price: gift.price,
  priceInr: gift.priceInr || 0,
  priceGlobal: gift.priceGlobal || 0,
  value: gift.value,
  status: gift.status,
  usage: gift.usage || 0,
  soundUrl: gift.soundUrl,
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
    const { name, priceInr, priceGlobal, icon, status, soundUrl } = req.body || {};
    const numericPriceInr = Math.max(0, Number(priceInr || 0));
    const numericPriceGlobal = Math.max(0, Number(priceGlobal || 0));

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    let finalSoundUrl = soundUrl || null;
    if (req.file) {
      finalSoundUrl = `/uploads/${req.file.filename}`;
    }

    const gift = await Gift.create({
      name: String(name).trim(),
      icon: icon || "🎁",
      price: numericPriceInr, // Fallback for old code
      priceInr: numericPriceInr,
      priceGlobal: numericPriceGlobal,
      priceUsd: numericPriceGlobal || 10, // Use global as USD base, default 10
      value: numericPriceInr,
      status: status || "Active",
      soundUrl: finalSoundUrl
    });

    return res.status(201).json({ success: true, gift: toAdminGift(gift) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGift = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, priceInr, priceGlobal, icon, status, soundUrl } = req.body || {};

    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (icon !== undefined) update.icon = icon || "🎁";
    if (priceInr !== undefined) {
      const numericPriceInr = Math.max(0, Number(priceInr || 0));
      update.priceInr = numericPriceInr;
      update.price = numericPriceInr; // Sync old price
      update.value = numericPriceInr;
    }
    if (priceGlobal !== undefined) {
      const numericPriceGlobal = Math.max(0, Number(priceGlobal || 0));
      update.priceGlobal = numericPriceGlobal;
      update.priceUsd = numericPriceGlobal; // Keep USD in sync
    }
    if (status !== undefined) update.status = status;
    
    if (req.file) {
      update.soundUrl = `/uploads/${req.file.filename}`;
    } else if (soundUrl !== undefined) {
      update.soundUrl = soundUrl || null;
    }

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

