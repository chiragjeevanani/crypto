const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Gift = require('./backend/models/Gift');

async function checkGifts() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crypto');
        const gifts = await Gift.find({});
        console.log('Total Gifts:', gifts.length);
        gifts.forEach(g => {
            console.log(`- ${g.name} (${g.icon}): Status=${g.status}, PriceUSD=${g.priceUsd}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkGifts();
