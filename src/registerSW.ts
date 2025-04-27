// Register Service Worker for PWA functionality

// Simplified service worker registration
export const registerServiceWorker = () => {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker after the page load
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        } catch (error) {
          console.log('ServiceWorker registration failed: ', error);
        }
      });
    } catch (error) {
      console.error('Service worker registration error:', error);
    }
  } else {
    console.log('Service workers are not supported by this browser');
  }
};

export const checkForServiceWorkerUpdate = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
};

export const unregisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
};