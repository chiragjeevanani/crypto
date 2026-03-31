const Gift = require("../models/Gift");

const defaultGifts = [
  { name: "Rose", icon: "🌹", price: 2, value: 2, status: "Active" },
  { name: "Egg", icon: "🥚", price: 2, value: 2, status: "Active" },
  { name: "Tomato", icon: "🍅", price: 2, value: 2, status: "Active" },
  { name: "Golden Heart", icon: "💛", price: 5, value: 5, status: "Active" },
  { name: "Premium Heart", icon: "💎", price: 10, value: 10, status: "Active" }
];

const seedGifts = async () => {
  try {
    const count = await Gift.countDocuments();
    if (count > 0) return;

    await Gift.create(defaultGifts);
    console.log("Default gifts seeded successfully");
  } catch (error) {
    console.error("Error seeding gifts:", error.message);
  }
};

module.exports = seedGifts;
