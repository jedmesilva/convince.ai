import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for PWA functionality - this will only run in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    } catch (error) {
      console.error('ServiceWorker registration failed: ', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
