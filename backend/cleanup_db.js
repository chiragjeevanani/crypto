const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // Workaround for querySrv ECONNREFUSED

require("dotenv").config();
const WalletTransaction = require("./models/WalletTransaction");

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Cleaning up duplicate null keys...");
        const res = await WalletTransaction.deleteMany({ type: "deposit", idempotencyKey: null });
        console.log("Deleted count:", res.deletedCount);
    } catch (e) {
        console.error("Cleanup Error:", e.message);
    }
    process.exit(0);
}

cleanup();
