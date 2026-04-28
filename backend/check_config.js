const mongoose = require('mongoose');
const AdminConfig = require('./models/AdminConfig');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crypto');
        const config = await AdminConfig.findOne();
        console.log('CURRENT CONFIG IN DB:');
        console.log(JSON.stringify(config, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
