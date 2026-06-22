import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { phone, amount, reference } = req.body;

    // 1. Configurações da Movitel (e-Mola)
    const EMOLA_API_KEY = process.env.EMOLA_API_KEY;
  const EMOLA_CLIENT_ID = process.env.EMOLA_CLIENT_ID;
  const EMOLA_CLIENT_SECRET = process.env.EMOLA_CLIENT_SECRET;
  const EMOLA_BASE_URL = process.env.EMOLA_BASE_URL || 'https://api.emola.movitel.co.mz';

    if (!EMOLA_API_KEY || !EMOLA_CLIENT_ID) {
      return res.status(500).json({ error: 'Configuração da API e-Mola não encontrada.' });
    }

    const baseUrl = EMOLA_BASE_URL;

    // 2. Obter token de acesso caso não tenha sido fornecido
    let accessToken = EMOLA_API_KEY; // assume API key is a token
    if (!accessToken) {
      // Solicitar token usando client_id e client_secret
      const tokenResp = await fetch(`${baseUrl}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: EMOLA_CLIENT_ID,
          client_secret: EMOLA_CLIENT_SECRET,
          grant_type: 'client_credentials'
        })
      });
      const tokenData = await tokenResp.json();
      if (!tokenResp.ok || !tokenData.access_token) {
        return res.status(500).json({ error: 'Falha ao obter token da e-Mola.', details: tokenData });
      }
      accessToken = tokenData.access_token;
    }

    // Formatar telefone
    let formattedPhone = String(phone).replace(/\D/g, '');
    if (formattedPhone.startsWith('258')) formattedPhone = formattedPhone.substring(3);

    // Payload para e-Mola (Exemplo genérico - pode variar conforme a versão da API)
    const payload = {
      appId: EMOLA_APP_ID,
      token: EMOLA_API_KEY,
      msisdn: formattedPhone,
      amount: amount,
      orderId: reference || `EM-${Date.now()}`,
      description: 'Pagamento Evolux Prod'
    };

    const response = await fetch(`${baseUrl}/v1/payments/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'SUCCESS') {
      return res.status(400).json({ 
        error: 'Falha na cobrança via e-Mola.',
        details: data.message || data
      });
    }

    return res.status(200).json({
      success: true,
      transactionId: data.transactionId,
      message: 'Solicitação e-Mola enviada! Verifique o PIN no seu Movitel.'
    });

  } catch (error) {
    console.error("Erro e-Mola:", error);
    return res.status(500).json({ error: 'Erro ao contactar e-Mola.' });
  }
}
