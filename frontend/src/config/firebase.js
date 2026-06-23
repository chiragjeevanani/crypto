import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// You will need to fill these missing values in your .env file
// Get them from Firebase Console -> Project Settings -> General -> Web Apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "knqreels.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "knqreels",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "knqreels.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.warn("⚠️ Firebase Client SDK initialization skipped or failed:", error.message);
}

export { app, messaging };
