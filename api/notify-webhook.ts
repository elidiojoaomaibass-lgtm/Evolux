export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { webhookUrl, payload } = req.body;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return res.status(400).json({ error: 'URL de webhook inválida ou em falta.' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.status(200).json({
      success: true,
      webhookStatus: response.status,
      webhookOk: response.ok,
    });
  } catch (err: any) {
    console.error('Erro ao notificar webhook do utilizador:', err.message);
    return res.status(500).json({ error: err.message || 'Erro ao contactar o webhook.' });
  }
}
