import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (reuse environment variables)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * API route to store/update an FCM token for a user.
 * Expected JSON body: { userId: string, token: string }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, token } = req.body ?? {};
  if (!userId || !token) {
    return res.status(400).json({ error: 'Missing userId or token' });
  }

  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, token }, { onConflict: 'user_id' });
    if (error) throw error;
    return res.status(200).json({ message: 'Token stored', data });
  } catch (e) {
    console.error('Error upserting push token', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
