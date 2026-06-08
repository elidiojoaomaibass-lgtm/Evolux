// firebase-messaging-sw.js
// Replace the placeholder values with your Firebase project configuration.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyDhIwBjlR_YEqbsZTx_TT64tO_c8-bhR6M',
  authDomain: 'evolux-b9300.firebaseapp.com',
  projectId: 'evolux-b9300',
  storageBucket: 'evolux-b9300.firebasestorage.app',
  messagingSenderId: '414354486042',
  appId: '1:414354486042:web:53f0d264b1f059570532a3'
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Nova Notificação';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova atualização.',
    icon: payload.notification?.icon || '/logo.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
