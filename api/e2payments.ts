import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { phone, amount, reference, client_id, client_secret, wallet_mpesa, wallet_emola } = req.body;

    // Lógica para selecionar a carteira correta baseada no prefixo do número do cliente
    let wallet_number = wallet_mpesa || process.env.E2_WALLET_MPESA; // Default M-Pesa
    
    if (phone.startsWith('86') || phone.startsWith('87') || phone.startsWith('+25886') || phone.startsWith('+25887')) {
      wallet_number = wallet_emola || process.env.E2_WALLET_EMOLA;
    }

    // 1. Obter Token da E2Payments
    const authResponse = await fetch('https://api.e2payments.co.mz/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: client_id || process.env.E2_CLIENT_ID,
        client_secret: client_secret || process.env.E2_CLIENT_SECRET
      })
    });

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.access_token) {
      return res.status(401).json({ error: 'Falha na autenticação com E2Payments.' });
    }

    const token = authData.access_token;

    // 2. Criar Pedido de Pagamento (C2B)
    const paymentResponse = await fetch('https://api.e2payments.co.mz/v1/c2b/payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: client_id || process.env.E2_CLIENT_ID,
        amount: amount,
        phone_number: phone,
        wallet_number: wallet_number,
        reference: reference || `EV-${Date.now()}`
      })
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return res.status(paymentResponse.status || 400).json({ 
        error: paymentData.message || 'Erro ao processar pagamento na E2Payments.',
        details: paymentData
      });
    }

    return res.status(200).json({
      success: true,
      transactionId: paymentData.transaction_id,
      message: 'Solicitação enviada! Por favor, confirme no seu telemóvel.'
    });

  } catch (error: any) {
    console.error("Erro E2Payments:", error);
    return res.status(500).json({ 
      error: 'Erro interno no servidor de pagamento.',
      message: error.message 
    });
  }
}
