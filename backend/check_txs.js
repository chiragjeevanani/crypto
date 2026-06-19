const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/crypto-appzeto/crypto/backend/.env' });

const WalletTransaction = require('./models/WalletTransaction');
const User = require('./models/User');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the user who has ~8700 earningCoins
    const user = await User.findOne({ earningCoins: { $gt: 8000 } });
    if (!user) {
        console.log("User not found");
        process.exit(0);
    }
    console.log("User ID:", user._id, "Earning Coins:", user.earningCoins);

    const txs = await WalletTransaction.find({ userId: user._id });
    console.log("Total Transactions:", txs.length);

    let sum = 0;
    for (const tx of txs) {
        console.log(`Type: ${tx.type}, Coins: ${tx.coins}, Amount: ${tx.amount}`);
        if (tx.type === 'gift_received' || tx.type === 'nft_sale' || tx.referenceType === 'auction_sale') {
            sum += tx.coins;
        }
    }
    console.log("Sum of gifts + nfts:", sum);
    
    process.exit(0);
}

run();
