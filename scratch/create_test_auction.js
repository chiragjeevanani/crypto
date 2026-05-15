const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

async function createTestAuction() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const AuctionSchema = new mongoose.Schema({}, { strict: false });
        const Auction = mongoose.model('Auction', AuctionSchema);

        const testAuction = new Auction({
            title: 'Automated Browser Test NFT',
            description: 'This is a test NFT created for automated browser verification.',
            creator: new mongoose.Types.ObjectId('69ca62077ca10e91c45b5f6a'),
            basePrice: 100,
            currentBid: 100,
            mediaUrl: 'https://gateway.pinata.cloud/ipfs/QmZ4tS6Z8B6B8B6B8B6B8B6B8B6B8B6B8B6B8B6B8B6B8B', // Placeholder
            mediaType: 'image',
            status: 'pending',
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000), // 24 hours from now
            royaltyPct: 15,
            isWeb3: true
        });

        const saved = await testAuction.save();
        console.log('Auction Created:', saved._id);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createTestAuction();
