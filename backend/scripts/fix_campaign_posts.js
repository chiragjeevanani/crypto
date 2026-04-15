const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/crypto-appzeto/crypto/backend/.env' });
const Post = require('./models/Post');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const result = await Post.updateMany(
            { category: 'Campaign', isPublished: false },
            { $set: { isPublished: true } }
        );
        
        console.log(`Updated ${result.modifiedCount} campaign posts to be published.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
