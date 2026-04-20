const mongoose = require('mongoose');
const AdminConfig = require('../backend/models/AdminConfig');
const { notifyAdmins } = require('../backend/utils/adminNotifier');

async function test() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/crypto-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to DB');

        const config = await AdminConfig.findOne();
        console.log('Config:', config);

        const result = await notifyAdmins('Test notification');
        console.log('Notification result:', result);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
