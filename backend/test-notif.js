const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('./models/Notification');
const User = require('./models/User');

async function testNotif() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // Find two random users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('Need at least 2 users in DB');
      process.exit(0);
    }
    
    const sender = users[0];
    const recipient = users[1];
    
    console.log(`Creating test notification from ${sender.name} to ${recipient.name}`);
    
    const notif = await Notification.create({
      recipientId: recipient._id,
      senderId: sender._id,
      type: 'follow',
      title: `${sender.name} followed you manually`,
      subtitle: 'Testing notification system.',
      meta: { followerId: sender._id.toString() }
    });
    
    console.log('Notification created:', notif._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testNotif();
