const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); 

require("dotenv").config();

async function dropIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        console.log("Dropping unique index...");
        await db.collection("wallettransactions").dropIndex("userId_1_type_1_idempotencyKey_1");
        console.log("Index dropped successfully.");
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}

dropIndex();
