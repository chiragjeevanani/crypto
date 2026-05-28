const mongoose = require('mongoose');
const NFTOwnership = require('./models/NFTOwnership');
const Auction = require('./models/Auction');

mongoose.connect('mongodb+srv://sheetaldatacode_db_user:BFSw6i820156rrjl@kqreels.zljevvq.mongodb.net/crypto-appzeto?retryWrites=true&w=majority&appName=kqreels').then(async () => {
    const ownerships = await NFTOwnership.find();
    console.log("ALL OWNERSHIPS:", ownerships);
    const auctions = await Auction.find({ nftStatus: { $ne: "not_started" } });
    console.log("AUCTIONS:", auctions.map(a => ({ id: a._id, status: a.nftStatus, winner: a.winnerWalletAddress })));
    process.exit(0);
});
