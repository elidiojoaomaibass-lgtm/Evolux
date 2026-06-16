import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple JWT signer for Google OAuth2 (no external library needed)
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const signingInput = `${base64url(header)}.${base64url(payload)}`;

  // Import the private key
  const pemKey = serviceAccount.private_key;
  const pemBody = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const jwt = `${signingInput}.${sigBase64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const { title, body, user_email } = await req.json();
      if (!title || !body) {
        return new Response(JSON.stringify({ error: 'title and body are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all push tokens from Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

      const tableRes = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=token`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      const tokens: { token: string }[] = await tableRes.json();

      if (!tokens || tokens.length === 0) {
        return new Response(JSON.stringify({ message: 'No tokens found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Parse Firebase Service Account
      const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '';
      const serviceAccount = JSON.parse(serviceAccountRaw);
      const projectId = serviceAccount.project_id;

      // Get access token
      const accessToken = await getGoogleAccessToken(serviceAccount);
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      let successCount = 0;
      let failureCount = 0;

      for (const { token } of tokens) {
        const payload = {
          message: {
            token,
            notification: { title, body },
            android: { priority: 'high' },
            apns: { payload: { aps: { 'content-available': 1, sound: 'default' } } },
          },
        };

        const res = await fetch(fcmUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          failureCount++;
          const err = await res.text();
          console.error(`FCM error for token: ${err}`);
        }
      }

      return new Response(JSON.stringify({ successCount, failureCount, totalTokens: tokens.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.error('Edge Function error:', err);
      return new Response(JSON.stringify({ error: err.message || String(err) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
