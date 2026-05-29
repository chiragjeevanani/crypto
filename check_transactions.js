const mongoose = require("mongoose");
const WalletTransaction = require("./backend/models/WalletTransaction");
require("dotenv").config({ path: "./backend/.env" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const txs = await WalletTransaction.find({ type: "deposit", status: "pending" }).sort({ createdAt: -1 }).limit(5);
  console.log("Pending transactions:");
  console.log(JSON.stringify(txs, null, 2));
  process.exit(0);
}

check();
