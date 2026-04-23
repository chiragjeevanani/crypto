const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");
        
        const userId = '69afb02b99fb1c8a9a40fbca';
        const user = await User.findById(userId);
        
        if (user) {
            console.log("User found in DB:");
            console.log({
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                updatedAt: user.updatedAt
            });
        } else {
            console.log("User not found");
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkUser();
