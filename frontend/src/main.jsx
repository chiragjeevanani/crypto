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
    const isAdmin = window.location.pathname.startsWith('/admin');
    const prefix = isAdmin ? 'admin_' : '';
    const tokenKey = `crypto_${prefix}auth_token`;
    if (localStorage.getItem(tokenKey)) {
      localStorage.removeItem(`crypto_${prefix}auth_token`);
      localStorage.removeItem(`crypto_${prefix}refresh_token`);
      localStorage.removeItem(`crypto_${prefix}auth_user`);
      window.location.href = isAdmin ? "/admin/login" : "/signin";
    }
  }
  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
