const mongoose = require("mongoose");
require("dotenv").config();
const WalletTransaction = require("./models/WalletTransaction");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const txs = await WalletTransaction.find({ type: "deposit", idempotencyKey: null });
    console.log("Documents with null idempotencyKey for deposit:", txs.length);
    txs.forEach(t => console.log(t._id, t.userId));
    process.exit(0);
}

check();
