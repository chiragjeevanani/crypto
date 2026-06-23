// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Ensure you replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyBiB4bk1NS6VUPMjTeBCfm1sLcfrpPR8LU",
  authDomain: "knqreels.firebaseapp.com",
  projectId: "knqreels",
  storageBucket: "knqreels.firebasestorage.app",
  messagingSenderId: "385158353051",
  appId: "1:385158353051:web:170957255266d7de4c363e",
  measurementId: "G-1L3QLKSTCT"
};

// Initialize the Firebase app in the service worker
try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/logo.png', // Update with actual icon path
      badge: '/badge.png', // Update with actual badge path
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.warn("⚠️ Firebase SW initialization skipped or failed:", error.message);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Add logic here to open a specific page when the notification is clicked
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url === urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }
      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
