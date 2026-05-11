import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { phone, amount, reference } = req.body;

    // 1. Configurações da Movitel (e-Mola)
    const EMOLA_API_KEY = process.env.EMOLA_API_KEY;
    const EMOLA_APP_ID = process.env.EMOLA_APP_ID;
    const EMOLA_ENVIRONMENT = process.env.EMOLA_ENVIRONMENT || 'sandbox';

    if (!EMOLA_API_KEY || !EMOLA_APP_ID) {
      return res.status(500).json({ error: 'Configuração da API e-Mola não encontrada.' });
    }

    const baseUrl = EMOLA_ENVIRONMENT === 'sandbox'
      ? 'https://api.sandbox.emola.movitel.co.mz'
      : 'https://api.emola.movitel.co.mz';

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
