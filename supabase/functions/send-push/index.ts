import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { GoogleAuth } from "npm:google-auth-library@9.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default {
  async fetch(req: Request) {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // Parse request body
      const { user_email, title, body, data } = await req.json();
      if (!title || !body) {
        return new Response(JSON.stringify({ error: 'title and body are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Initialize Supabase Client to get the user's push tokens
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
      
      const { createClient } = await import("npm:@supabase/supabase-js@2.39.3");
      const supabase = createClient(supabaseUrl, supabaseKey);

      // We need to find tokens for the user_email. Wait, push_subscriptions uses user_id, not email.
      // Let's assume push_subscriptions has a column "user_email" or "user_id".
      // We will select both email and token if we can, or just token by user_id.
      // Wait, in store.ts we use user_email. Let's select tokens where email matches.
      // Wait, let's fetch all tokens if user_email is not provided (for broadcast).
      
      let query = supabase.from('push_subscriptions').select('token');
      if (user_email) {
        query = query.eq('user_email', user_email);
      }

      const { data: tokensData, error: dbError } = await query;
      
      if (dbError) throw dbError;
      
      const tokens = tokensData?.map(t => t.token) || [];
      if (tokens.length === 0) {
        return new Response(JSON.stringify({ message: 'No tokens found for user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Authenticate with Google
      const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
      if (!serviceAccountJson) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in Edge Function secrets');
      }

      const credentials = JSON.parse(serviceAccountJson);
      const projectId = credentials.project_id;

      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });

      const client = await auth.getClient();
      const tokenInfo = await client.getAccessToken();
      const accessToken = tokenInfo?.token;

      if (!accessToken) {
        throw new Error('Failed to get access token from Google');
      }

      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      let successCount = 0;
      let failureCount = 0;

      for (const token of tokens) {
        const payload = {
          message: {
            token,
            notification: { title, body },
            data: data || {},
            android: { priority: 'high' },
            apns: { payload: { aps: { 'content-available': 1 } } },
          },
        };

        const res = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          failureCount++;
          console.error(`FCM send error for token ${token}:`, await res.text());
        }
      }

      return new Response(JSON.stringify({ successCount, failureCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
