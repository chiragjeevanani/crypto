const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); 

require("dotenv").config();

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const indexes = await db.collection("wallettransactions").listIndexes().toArray();
        console.log(JSON.stringify(indexes, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}

checkIndexes();
