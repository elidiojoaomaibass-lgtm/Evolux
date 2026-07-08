import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { phone, amount, network, txid } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (!phone || !amount || !network) {
      return res.status(400).json({ error: 'Faltam parâmetros (phone, amount, network)' });
    }

    const token = process.env.RLX_API_TOKEN || process.env.VITE_RLX_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'RLX_API_TOKEN não configurado no servidor.' });
    }

    // Número principal da plataforma configurado conforme solicitado
    const sourceNumber = network === 'mpesa' ? '856195186' : '877575186';

    const apiUrl = 'https://checkout.rlxl.ink/api.php';

    const requestBody = {
      action: 'b2c',
      phone: phone, // Destino do saque
      amount: amount,
      source_phone: sourceNumber, // Origem da plataforma
      sender: sourceNumber, // Enviando as duas variações por precaução caso a API espere outra chave
      remetente: sourceNumber,
      txid: txid || `B2C-${Date.now()}`
    };

    console.log('[RLX B2C] Enviando para:', apiUrl, JSON.stringify(requestBody).slice(0, 200));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[RLX B2C Proxy] Resposta não-JSON:', rawText.slice(0, 300));
      return res.status(502).json({
        error: 'RLX Gateway devolveu resposta inválida no B2C.',
        raw: rawText.slice(0, 300),
      });
    }

    console.log('[RLX B2C Proxy] Resposta:', response.status, JSON.stringify(data).slice(0, 200));

    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (error: any) {
    console.error('[RLX B2C Proxy] Erro fatal:', error.message || error);
    return res.status(500).json({ error: error.message || 'Erro interno no B2C RLX.' });
  }
}
