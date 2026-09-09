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

// ─── Web Share Target ────────────────────────────────────────────────────
// manifest.json's share_target.action points here. The OS share sheet POSTs
// the shared file/text as multipart form data to this URL; only a service
// worker can intercept that POST (a plain page can't receive it), so this
// stashes the file in Cache Storage under well-known keys and redirects the
// navigation to /messaging?sharedFile=pending, which MessagingPage.jsx reads
// on load to pull the file back out, upload it, and open the "pick a
// contact" screen with it pre-attached.
const SHARE_CACHE_NAME = 'knq-share-target-v1';
const SHARE_FILE_KEY = '/__shared-file';
const SHARE_META_KEY = '/__shared-meta';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(event));
  }
});

async function handleShareTarget(event) {
  const redirectUrl = new URL('/messaging', self.location.origin);
  try {
    const formData = await event.request.formData();
    const file = formData.get('sharedFile');
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';

    if (file && typeof file === 'object' && file.size > 0) {
      const cache = await caches.open(SHARE_CACHE_NAME);
      await cache.put(SHARE_FILE_KEY, new Response(file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' }
      }));
      await cache.put(SHARE_META_KEY, new Response(JSON.stringify({
        name: file.name || '', type: file.type || '', title, text
      }), { headers: { 'Content-Type': 'application/json' } }));
      redirectUrl.searchParams.set('sharedFile', 'pending');
    } else if (text || title) {
      redirectUrl.searchParams.set('text', text || title);
    }
  } catch (err) {
    console.error('[share-target] failed to handle shared content', err);
  }
  return Response.redirect(redirectUrl.href, 303);
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
