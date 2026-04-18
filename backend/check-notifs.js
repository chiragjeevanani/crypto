const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('./models/Notification');

async function checkNotifications() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const latest = await Notification.find({ type: 'follow' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('senderId', 'name handle')
      .populate('recipientId', 'name handle');
      
    console.log('Latest Follow Notifications:');
    latest.forEach(n => {
      console.log(`[${n.createdAt}] From: ${n.senderId?.name} (@${n.senderId?.handle}) -> To: ${n.recipientId?.name} (@${n.recipientId?.handle}) | Title: ${n.title}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkNotifications();
