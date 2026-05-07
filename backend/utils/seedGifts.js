const Gift = require("../models/Gift");

const defaultGifts = [
  { name: "Rose", icon: "🌹", price: 2, priceInr: 2, priceUsd: 1, priceGlobal: 1, value: 2, status: "Active" },
  { name: "Egg", icon: "🥚", price: 2, priceInr: 2, priceUsd: 1, priceGlobal: 1, value: 2, status: "Active" },
  { name: "Tomato", icon: "🍅", price: 2, priceInr: 2, priceUsd: 1, priceGlobal: 1, value: 2, status: "Active" },
  { name: "Golden Heart", icon: "💛", price: 5, priceInr: 5, priceUsd: 5, priceGlobal: 5, value: 5, status: "Active" },
  { name: "Premium Heart", icon: "💎", price: 10, priceInr: 10, priceUsd: 10, priceGlobal: 10, value: 10, status: "Active" },
  { name: "Chocolate", icon: "🍫", price: 3, priceInr: 3, priceUsd: 2, priceGlobal: 2, value: 3, status: "Active" }
];

const seedGifts = async () => {
  try {
    const activeCount = await Gift.countDocuments({ status: "Active" });
    if (activeCount > 0) return;

    // If no active gifts, but some exist, we might want to check further, 
    // but for now let's just seed if absolute count is 0 or no active gifts found.
    const totalCount = await Gift.countDocuments();
    if (totalCount === 0) {
      await Gift.create(defaultGifts);
      console.log("[Seed] Default gifts seeded successfully");
    }
  } catch (error) {
    console.error("[Seed] Error seeding gifts:", error.message);
  }
};

module.exports = seedGifts;
