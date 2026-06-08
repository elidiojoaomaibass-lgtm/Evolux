// Firebase Cloud Messaging service worker
// This file enables background push notifications when the app is closed or the device is locked.
// It mirrors the Firebase config used in the main app (replace with actual env values if needed).
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker. Use the same config as in src/lib/firebase.ts.
// The values are pulled from environment variables at build time.
firebase.initializeApp({
  apiKey: '<YOUR_API_KEY>',
  authDomain: '<YOUR_AUTH_DOMAIN>',
  projectId: '<YOUR_PROJECT_ID>',
  storageBucket: '<YOUR_STORAGE_BUCKET>',
  messagingSenderId: '<YOUR_MESSAGING_SENDER_ID>',
  appId: '<YOUR_APP_ID>'
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus or device is locked).
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Você recebeu um novo pedido! 🎉';
  const notificationOptions = {
    body: payload.notification?.body || 'Nova notificação de pagamento',
    icon: '/logo.png',
    // You can add more options like click_action, badge, etc.
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
