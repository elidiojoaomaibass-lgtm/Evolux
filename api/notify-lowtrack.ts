export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token, payload } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const endpoint = process.env.VITE_LOWTRAK_ENDPOINT || 'https://lowtrack.com.br/api/webhook';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        ...payload,
        event: payload.event === 'sale_approved' ? 'sale.approved' : payload.event,
        transaction_id: payload.reference,
        amount: payload.amount,
        status: payload.status || 'Concluído',
        user_id: payload.customer?.email || payload.customer?.phone || 'unknown_user',
      })
    });

    return res.status(200).json({
      success: true,
      lowtrackStatus: response.status,
      lowtrackOk: response.ok,
    });
  } catch (err: any) {
    console.error('Erro ao notificar LowTrack:', err.message);
    return res.status(500).json({ error: err.message || 'Erro ao contactar o LowTrack.' });
  }
}
