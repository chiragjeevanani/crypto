const User = require('../../models/User');
const { admin, isFirebaseInitialized } = require('../../config/firebaseAdmin');

exports.registerToken = async (req, res) => {
  try {
    if (!isFirebaseInitialized) {
      return res.status(503).json({ success: false, message: 'Firebase Admin not initialized on server' });
    }

    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const userId = req.user.userId;
    
    // Add token if it doesn't already exist in the array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: fcmToken }
    });

    // Optional: Subscribe to global topics
    try {
      await admin.messaging().subscribeToTopic([fcmToken], 'all_users');
    } catch (topicErr) {
      console.error('Topic subscription failed:', topicErr);
    }

    res.status(200).json({ success: true, message: 'Token registered successfully' });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unregisterToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const userId = req.user.userId;
    
    await User.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: fcmToken }
    });

    if (isFirebaseInitialized) {
      try {
        await admin.messaging().unsubscribeFromTopic([fcmToken], 'all_users');
      } catch (topicErr) {
        console.error('Topic unsubscription failed:', topicErr);
      }
    }

    res.status(200).json({ success: true, message: 'Token unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
