import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Função unificada para notificações externas.
 * Rota: /api/notify-ext
 * Body: { type: 'lowtrack' | 'webhook', ... }
 * - type 'lowtrack': { token, payload }
 * - type 'webhook': { webhookUrl, payload }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { type, token, webhookUrl, payload } = req.body ?? {};

  // ── LowTrack ──────────────────────────────────────────────────
  if (type === 'lowtrack') {
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const endpoint = process.env.VITE_LOWTRAK_ENDPOINT || 'https://lowtrack.com.br/api/webhook';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0',
        },
        body: JSON.stringify({
          ...payload,
          event: payload?.event === 'sale_approved' ? 'sale.approved' : payload?.event,
          transaction_id: payload?.reference,
          amount: payload?.amount,
          status: payload?.status || 'Concluído',
          user_id: payload?.customer?.email || payload?.customer?.phone || 'unknown_user',
        }),
      });
      return res.status(200).json({ success: true, lowtrackStatus: response.status, lowtrackOk: response.ok });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao contactar o LowTrack.' });
    }
  }

  // ── Webhook Externo ───────────────────────────────────────────
  if (type === 'webhook') {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return res.status(400).json({ error: 'URL de webhook inválida ou em falta.' });
    }
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.status(200).json({ success: true, webhookStatus: response.status, webhookOk: response.ok });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao contactar o webhook.' });
    }
  }

  return res.status(400).json({ error: 'Parâmetro "type" inválido. Use "lowtrack" ou "webhook".' });
}
