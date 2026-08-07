import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          agora: ['agora-rtc-sdk-ng', 'agora-rtc-react'],
          firebase: ['firebase/app', 'firebase/messaging'],
          gsap: ['gsap'],
          'framer-motion': ['framer-motion'],
        },
      },
    },
  },
});
