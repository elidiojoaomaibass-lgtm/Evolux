import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Garantir que temos o body
    const body = req.body || {};
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;

    const { phone, amount, reference, client_id, client_secret, wallet_mpesa, wallet_emola } = parsedBody;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor são obrigatórios.' });
    }

    const final_client_id = client_id || process.env.E2_CLIENT_ID;
    const final_client_secret = client_secret || process.env.E2_CLIENT_SECRET;

    if (!final_client_id || !final_client_secret) {
      return res.status(400).json({ error: 'Credenciais E2Payments (Client ID/Secret) não configuradas.' });
    }

    // Lógica para selecionar a carteira correta baseada no prefixo
    let wallet_number = wallet_mpesa || process.env.E2_WALLET_MPESA;
    
    if (phone.startsWith('86') || phone.startsWith('87') || phone.startsWith('+25886') || phone.startsWith('+25887')) {
      wallet_number = wallet_emola || process.env.E2_WALLET_EMOLA;
    }

    if (!wallet_number) {
       return res.status(400).json({ error: 'Número da carteira de receção não configurado.' });
    }

    // 1. Obter Token
    let authResponse;
    try {
      authResponse = await fetch('https://e2payments.explicador.co.mz/oauth/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: final_client_id,
          client_secret: final_client_secret
        })
      });
    } catch (fError: any) {
      return res.status(500).json({ error: 'Erro de rede ao contactar E2Payments (Token).', message: fError.message });
    }

    const authContentType = authResponse.headers.get("content-type");
    if (!authContentType || !authContentType.includes("application/json")) {
      const rawAuth = await authResponse.text();
      return res.status(500).json({ error: 'E2Payments respondeu com formato inválido no Token.', details: rawAuth });
    }

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.access_token) {
      return res.status(401).json({ 
        error: 'Falha na autenticação com E2Payments. Verifique Client ID e Secret.',
        details: authData 
      });
    }

    const token = authData.access_token;

    // 2. Criar Pedido de Pagamento (C2B)
    // Conforme documentação: https://mpesaemolatech.com/docs/api#transaction_c2b
    // Endpoint: /v1/c2b/mpesa-payment/{wallet_id}
    let paymentResponse;
    try {
      const paymentUrl = `https://e2payments.explicador.co.mz/v1/c2b/mpesa-payment/${wallet_number}`;
      
      paymentResponse = await fetch(paymentUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: final_client_id,
          amount: amount,
          phone: phone, // Campo correto é 'phone' conforme o Exemplo 06 da documentação
          reference: reference || `EV-${Date.now()}`
        })
      });
    } catch (pError: any) {
      return res.status(500).json({ error: 'Erro de rede ao processar pagamento na E2Payments.', message: pError.message });
    }

    const payContentType = paymentResponse.headers.get("content-type");
    if (!payContentType || !payContentType.includes("application/json")) {
      const rawPay = await paymentResponse.text();
      return res.status(500).json({ error: 'E2Payments respondeu com formato inválido no Pagamento.', details: rawPay });
    }

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return res.status(paymentResponse.status || 400).json({ 
        error: paymentData.message || 'Erro ao processar pagamento na E2Payments.',
        details: paymentData
      });
    }

    return res.status(200).json({
      success: true,
      transactionId: paymentData.transaction_id || paymentData.id,
      message: 'Solicitação enviada! Por favor, confirme no seu telemóvel.'
    });

  } catch (error: any) {
    console.error("Erro Fatal E2Payments:", error);
    return res.status(500).json({ 
      error: 'Erro fatal no servidor de pagamento.',
      message: error.message,
      stack: error.stack
    });
  }
}
