import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless Handler for KwikPay
 * Handles OAuth token acquisition and C2B payments server-to-server,
 * avoiding browser CORS restrictions ('Failed to fetch').
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { action, method, walletId, amount, phone, reference } = body;

    const clientId = process.env.KWIKPAY_CLIENT_ID || process.env.E2_CLIENT_ID || process.env.VITE_KWIKPAY_CLIENT_ID || process.env.VITE_E2_CLIENT_ID || '';
    const clientSecret = process.env.KWIKPAY_CLIENT_SECRET || process.env.E2_CLIENT_SECRET || process.env.VITE_KWIKPAY_CLIENT_SECRET || process.env.VITE_E2_CLIENT_SECRET || '';
    const defaultWalletId = process.env.KWIKPAY_WALLET_ID || process.env.E2_WALLET_MPESA || '';

    // 1. Get OAuth Access Token from KwikPay
    const tokenRes = await fetch('https://kwikpay.web.tr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('KwikPay OAuth Token Error:', tokenData);
      return res.status(tokenRes.status || 400).json({
        error: 'Falha na autenticação KwikPay',
        details: tokenData,
      });
    }

    if (action === 'token') {
      return res.status(200).json(tokenData);
    }

    // 2. Perform C2B Payment
    const targetWallet = walletId || defaultWalletId;
    const endpoint = method === 'emola' ? 'emola-payment' : 'mpesa-payment';

    // Sanitize phone to 9 digits
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('258') && cleanPhone.length > 9) {
      cleanPhone = cleanPhone.substring(3);
    }
    cleanPhone = cleanPhone.slice(-9);

    // KwikPay reference must be <= 20 characters
    const cleanRef = String(reference || `ORD${Date.now()}`).slice(0, 20);

    const paymentRes = await fetch(`https://kwikpay.web.tr/api/v1/c2b/${endpoint}/${targetWallet}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount),
        phone: cleanPhone,
        reference: cleanRef,
      }),
    });

    const paymentData = await paymentRes.json();
    console.log('KwikPay Payment Result:', JSON.stringify(paymentData, null, 2));
    return res.status(paymentRes.status).json(paymentData);

  } catch (error: any) {
    console.error('KwikPay Serverless Error:', error);
    return res.status(500).json({
      error: error.message || 'Erro interno no servidor de pagamentos.',
    });
  }
}
