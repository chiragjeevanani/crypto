const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // Load models
        const Auction = require("./models/Auction");
        const Bid = require("./models/Bid");
        const CollectibleOwnership = require("./models/CollectibleOwnership");
        const User = require("./models/User");

        const endedAuctions = await Auction.find({ status: "ended" });
        console.log(`Found ${endedAuctions.length} ended auctions:`);
        for (const a of endedAuctions) {
            console.log(`- Auction: ${a.title} (${a._id}) | Winner: ${a.winner} | Highest Bid: ${a.highestBid} | nftStatus: ${a.nftStatus}`);
            const ownership = await CollectibleOwnership.findOne({ auctionId: a._id });
            console.log(`  CollectibleOwnership record: ${ownership ? `FOUND (ID: ${ownership.collectibleId}, Owner: ${ownership.toUserId})` : 'NOT FOUND'}`);
        }

        const liveAuctions = await Auction.find({ status: "live" });
        console.log(`Found ${liveAuctions.length} live auctions.`);
        const now = new Date();
        const expiredLive = liveAuctions.filter(a => new Date(a.endDate) <= now);
        console.log(`Found ${expiredLive.length} live auctions that have reached their end date:`);
        for (const a of expiredLive) {
            console.log(`- Expired Live Auction: ${a.title} (${a._id}) | Winner: ${a.winner} | EndDate: ${a.endDate}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error in check script:", err);
        process.exit(1);
    }
}

check();
