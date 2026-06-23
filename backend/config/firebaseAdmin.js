const admin = require("firebase-admin");

let isFirebaseInitialized = false;

try {
  // If FIREBASE_PRIVATE_KEY is a single string with \n, it gets parsed automatically.
  // We handle potential formatting issues just in case.
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("✅ Firebase Admin SDK initialized successfully.");
    isFirebaseInitialized = true;
  } else {
    console.warn("⚠️ Firebase Admin SDK not initialized: Missing credentials in .env");
  }
} catch (error) {
  console.error("❌ Firebase Admin SDK initialization error:", error);
}

module.exports = {
  admin,
  isFirebaseInitialized,
};
