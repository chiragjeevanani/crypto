const mongoose = require("mongoose");
const Category = require("./models/Category");
const dotenv = require("dotenv");

dotenv.config();

const categories = [
  { name: "Comedy", slug: "comedy", type: "all", displayOrder: 1 },
  { name: "Entertainment", slug: "entertainment", type: "all", displayOrder: 2 },
  { name: "Informational", slug: "informational", type: "all", displayOrder: 3 },
  { name: "Music", slug: "music", type: "all", displayOrder: 4 },
  { name: "Sports", slug: "sports", type: "all", displayOrder: 5 },
  { name: "General", slug: "general", type: "all", displayOrder: 100 }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/crypto-app");
    console.log("Connected to MongoDB for seeding categories...");

    for (const cat of categories) {
      await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
      console.log(`Seeded category: ${cat.name}`);
    }

    console.log("Categories seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedCategories();
