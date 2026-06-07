import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Save or update a FCM token for a user */
export const upsertPushToken = async (userId: string, token: string) => {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, token }, { onConflict: 'user_id' });
  if (error) throw error;
  return data;
};

/** Retrieve all FCM tokens for a given user */
export const getUserTokens = async (userId: string) => {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('token')
    .eq('user_id', userId);
  if (error) throw error;
  return data?.map((row: any) => row.token) ?? [];
};

/** Send a push notification via Firebase Cloud Messaging to a single token */
export const sendPushNotification = async (token: string, payload: { title: string; body: string; data?: Record<string, any> }) => {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    console.error('FCM_SERVER_KEY not set');
    return;
  }
  const message = {
    to: token,
    notification: { title: payload.title, body: payload.body },
    data: payload.data || {}
  };
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: { Authorization: `key=${serverKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    const result = await response.json();
    if (!response.ok) console.error('FCM send error', result);
    else console.log('FCM notification sent', result);
  } catch (e) {
    console.error('Error sending FCM notification', e);
  }
};
