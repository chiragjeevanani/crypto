const { admin, isFirebaseInitialized } = require('../config/firebaseAdmin');
const User = require('../models/User');

class PushNotificationService {
  /**
   * Send a push notification to a specific user using their FCM tokens
   * Automatically cleans up invalid/expired tokens.
   */
  static async sendToUser(userId, title, body, data = {}) {
    if (!isFirebaseInitialized) return;

    try {
      const user = await User.findById(userId).select('fcmTokens');
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

      const message = {
        notification: { title, body },
        data: {
          ...data,
          click_action: "FLUTTER_NOTIFICATION_CLICK" // Common for cross-platform
        },
        tokens: user.fcmTokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(user.fcmTokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await User.findByIdAndUpdate(userId, {
            $pullAll: { fcmTokens: failedTokens }
          });
          console.log(`🧹 Removed ${failedTokens.length} dead FCM tokens for user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Error sending push to user:', error);
    }
  }

  /**
   * Send a broadcast notification to all subscribed users
   */
  static async sendToTopic(topic, title, body, data = {}) {
    if (!isFirebaseInitialized) return;

    try {
      const message = {
        notification: { title, body },
        data,
        topic
      };
      await admin.messaging().send(message);
    } catch (error) {
      console.error(`Error sending push to topic ${topic}:`, error);
    }
  }
}

module.exports = PushNotificationService;
