import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// TODO: Substitua pelos valores reais de configuração do Firebase ou use variáveis de ambiente.
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
 * Recupera o token FCM do dispositivo atual.
 * Chame isso depois que o usuário conceder permissão de Notificação.
 */
export const getFcmToken = async (registration?: ServiceWorkerRegistration): Promise<string | null> => {
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (err) {
    console.error('Erro ao buscar token FCM', err);
    return null;
  }
};

// Opcional: escuta mensagens em primeiro plano.
export const onFcmMessage = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    console.log('Mensagem FCM em primeiro plano', payload);
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
    console.log('Token FCM armazenado para uid', uid);
  } catch (err) {
    console.error('Erro ao armazenar token FCM', err);
  }
};

/**
 * Solicita permissão de notificação ao navegador, obtém o token FCM e o armazena no Firestore.
 * Se um ID de usuário for fornecido, o token será associado a esse usuário. Caso contrário, será armazenado localmente.
 */
export const requestPermissionAndStoreToken = async (uid?: string): Promise<void> => {
  // Solicita permissão ao navegador
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Permissão de notificação não concedida');
    return;
  }

  // Obtém o token FCM
  const token = await getFcmToken();
  if (!token) {
    console.warn('Falha ao obter token FCM');
    return;
  }

  // Armazena o token se UID estiver disponível
  if (uid) {
    await storeFcmToken(uid, token);
  } else {
    // Alternativa: armazena em localStorage para associação posterior
    localStorage.setItem('fcm_token', token);
  }
};

