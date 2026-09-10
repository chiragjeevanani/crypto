import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

// Global fetch interceptor to handle auto-logout for deleted/banned/unauthorized users
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);
  if (response.status === 401) {
    const path = window.location.pathname;
    const isAdmin = path.startsWith('/admin');
    const isStaff = path.startsWith('/staff') && !path.startsWith('/staff/login') && !path.startsWith('/staff/forgot') && !path.startsWith('/staff/reset');

    if (isStaff) {
      if (localStorage.getItem('crypto_staff_auth_token')) {
        localStorage.removeItem('crypto_staff_auth_token');
        localStorage.removeItem('crypto_staff_auth_user');
        window.location.href = '/staff/login';
      }
    } else {
      const prefix = isAdmin ? 'admin_' : '';
      const tokenKey = `crypto_${prefix}auth_token`;
      if (localStorage.getItem(tokenKey)) {
        localStorage.removeItem(`crypto_${prefix}auth_token`);
        localStorage.removeItem(`crypto_${prefix}refresh_token`);
        localStorage.removeItem(`crypto_${prefix}auth_user`);
        window.location.href = isAdmin ? '/admin/login' : '/signin';
      }
    }
  }
  return response;
};

// Registers firebase-messaging-sw.js, which now also handles the
// share_target POST from manifest.json (see the /share-target fetch
// handler in that file). Nothing previously registered a service worker at
// all — usePushNotifications.js's `navigator.serviceWorker.ready` await was
// hanging with no registration to resolve against, and the OS share sheet
// had no worker to intercept share_target's POST, so "Share to KnQ Reels"
// could open the app but never actually deliver the shared file.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
