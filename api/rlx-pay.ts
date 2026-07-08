import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy backend para o RLX Gateway.
 * O browser chama /api/rlx-pay e este endpoint repassa para https://checkout.rlxl.ink/api.php
 * Evita problemas de CORS porque a chamada é feita server-side.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const token = process.env.RLX_API_TOKEN || process.env.VITE_RLX_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'RLX_API_TOKEN não configurado no servidor.' });
    }

    const apiUrl = 'https://checkout.rlxl.ink/api.php';

    console.log('[RLX Proxy] Enviando para:', apiUrl, JSON.stringify(body).slice(0, 200));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data: any;
    const rawText = await response.text();
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[RLX Proxy] Resposta não-JSON:', rawText.slice(0, 300));
      return res.status(502).json({
        error: 'O provedor de pagamentos encontra-se temporariamente indisponível. Por favor, tente novamente mais tarde.',
        raw: rawText.slice(0, 300),
      });
    }

    console.log('[RLX Proxy] Resposta:', response.status, JSON.stringify(data).slice(0, 200));

    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (error: any) {
    console.error('[RLX Proxy] Erro fatal:', error.message || error);
    return res.status(500).json({ error: error.message || 'Erro interno no proxy RLX.' });
  }
}
