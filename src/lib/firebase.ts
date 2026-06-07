import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// TODO: Replace with your actual Firebase config values or use environment variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Retrieves the FCM token for the current device.
 * Call this after the user has granted Notification permission.
 */
export const getFcmToken = async (): Promise<string | null> => {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_PUBLIC_VAPID_KEY', // Replace with your VAPID key.
    });
    return token;
  } catch (err) {
    console.error('Error fetching FCM token', err);
    return null;
  }
};

// Optional: listen for foreground messages.
export const onFcmMessage = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    console.log('FCM foreground message', payload);
    callback(payload);
  });
};
