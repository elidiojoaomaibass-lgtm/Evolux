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
export const getFcmToken = async (registration?: ServiceWorkerRegistration): Promise<string | null> => {
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
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
import { getFirestore, doc, setDoc } from 'firebase/firestore';

/**
 * Persiste o token FCM no Firestore sob users/{uid}/tokens.
 * Chame após getFcmToken quando o usuário estiver autenticado.
 */
export const storeFcmToken = async (uid: string, token: string) => {
  try {
    const db = getFirestore();
    await setDoc(doc(db, 'users', uid, 'tokens', 'device'), { token }, { merge: true });
    console.log('FCM token stored for uid', uid);
  } catch (err) {
    console.error('Error storing FCM token', err);
  }
};

/**
 * Requests browser notification permission, obtains the FCM token, and stores it in Firestore.
 * If a user ID is provided, the token is linked to that user. Otherwise it is stored locally.
 */
export const requestPermissionAndStoreToken = async (uid?: string): Promise<void> => {
  // Request permission from the browser
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  // Get the FCM token
  const token = await getFcmToken();
  if (!token) {
    console.warn('Failed to obtain FCM token');
    return;
  }

  // Store token if UID is available
  if (uid) {
    await storeFcmToken(uid, token);
  } else {
    // Fallback: store in localStorage for later association
    localStorage.setItem('fcm_token', token);
  }
};
