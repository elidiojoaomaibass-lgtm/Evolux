// src/lib/push_v1.ts
import { readFile } from 'node:fs/promises';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';

// ---------------------------------------------------------------
//      Configurações – variáveis de ambiente
// ---------------------------------------------------------------
const getProjectId = () => process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

// ---------------------------------------------------------------
//      Função para obter token de acesso OAuth2
// ---------------------------------------------------------------
async function getAccessToken(): Promise<string> {
  const projectId = getProjectId();
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID não está definido no ambiente');

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  let credentials;
  if (serviceAccountJson) {
      credentials = JSON.parse(serviceAccountJson);
  } else if (credPath) {
      credentials = JSON.parse(await readFile(credPath, 'utf8'));
  } else {
      throw new Error('A variável FIREBASE_SERVICE_ACCOUNT ou GOOGLE_APPLICATION_CREDENTIALS não está definida. Impossível enviar push.');
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const tokenInfo = await client.getAccessToken();
  if (!tokenInfo?.token) {
    throw new Error('Não foi possível obter token de acesso ao FCM');
  }
  return tokenInfo.token;
}

// ---------------------------------------------------------------
//      Envio de notificação usando API HTTP v1
// ---------------------------------------------------------------
// Updated to accept optional background flag and send both notification and data
export async function sendPushNotificationV1(
  token: string,
  payload: { title: string; body: string; url?: string; background?: boolean }
): Promise<void> {
  const accessToken = await getAccessToken();
  const projectId = getProjectId();

  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const body = {
    message: {
      token,
      // For foreground notifications, use the notification field
      ...(payload.background ? { data: { title: payload.title, body: payload.body } } : { notification: { title: payload.title, body: payload.body } }),
      webpush: {
        headers: {
          Urgency: 'high'
        },
        ...(payload.url && { fcmOptions: { link: payload.url } }),
        notification: {
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' // Fallback icon
        }
      },
      // Ensure high priority delivery for background messages
      android: { priority: 'high' },
      apns: { payload: { aps: { 'content-available': 1 } }, headers: { 'apns-priority': '10' } },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`FCM v1 error ${res.status}: ${errorText}`);
  }

  console.log('✅ Mensagem push v1 enviada', await res.json());
}

// ---------------------------------------------------------------
//      Funções auxiliares de gerenciamento de tokens (re‑uso do módulo existente)
// ---------------------------------------------------------------
export async function getUserTokens(userId: string): Promise<string[]> {
  // Re‑use the existing Supabase client logic – import lazily to avoid circular deps
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('token')
    .eq('user_email', userId);
  if (error) throw error;
  return data?.map((row: any) => row.token) ?? [];
}
