const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

const dnsServers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
}

const CampaignSchema = new mongoose.Schema({
    title: String,
    status: String,
    bannerType: String,
    bannerUrl: String,
    createdAt: Date
}, { strict: false });

const Campaign = mongoose.model('Campaign', CampaignSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).limit(5);
        console.log("Recent Campaigns:");
        campaigns.forEach(c => {
            console.log(`- ${c.title} [${c.status}] Type: ${c.bannerType} Created: ${c.createdAt}`);
            console.log(`  Url: ${c.bannerUrl}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
