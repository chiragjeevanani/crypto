const mongoose = require("mongoose");
const Category = require("./models/Category");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/crypto-app");
  const cats = await Category.find();
  console.log(JSON.stringify(cats, null, 2));
  process.exit();
}
run();
