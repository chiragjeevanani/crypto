const MarketingDeal = require("../../models/MarketingDeal");

/**
 * Create a new marketing deal
 */
const createDeal = async (req, res) => {
  try {
    const { title, price, mediaUrl, mediaType, link } = req.body;
    if (!title || !mediaUrl) {
      return res.status(400).json({ success: false, message: "Title and Media URL are required" });
    }

    const deal = await MarketingDeal.create({
      title,
      price: Number(price) || 0,
      media: {
        url: mediaUrl,
        type: mediaType || "video"
      },
      link: link || ""
    });

    return res.status(201).json({ success: true, deal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all marketing deals
 */
const listDeals = async (req, res) => {
  try {
    const deals = await MarketingDeal.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, deals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a marketing deal
 */
const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await MarketingDeal.findByIdAndDelete(id);
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }
    return res.status(200).json({ success: true, message: "Deal deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDeal,
  listDeals,
  deleteDeal
};
