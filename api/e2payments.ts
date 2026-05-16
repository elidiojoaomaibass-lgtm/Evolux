import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Garantir que temos o body
    const body = req.body || {};
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;

    const { phone, amount, reference, client_id, client_secret, wallet_mpesa, wallet_emola, type = 'c2b' } = parsedBody;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor são obrigatórios.' });
    }

    const final_client_id = (client_id || process.env.E2_CLIENT_ID || '').trim();
    const final_client_secret = (client_secret || process.env.E2_CLIENT_SECRET || '').trim();

    if (!final_client_id || !final_client_secret) {
      return res.status(400).json({ error: 'Credenciais E2Payments (Client ID/Secret) não configuradas.' });
    }

    console.log(`Debug Autenticação: Usando Client ID: ${final_client_id.substring(0, 8)}...`);

    // Lógica para selecionar a carteira correta e o provider baseado no prefixo
    let wallet_number = wallet_mpesa || process.env.E2_WALLET_MPESA;
    let provider = 'mpesa';
    
    // Prefixos e-Mola (86, 87)
    if (phone.startsWith('86') || phone.startsWith('87') || phone.startsWith('+25886') || phone.startsWith('+25887') || phone.startsWith('25886') || phone.startsWith('25887')) {
      wallet_number = wallet_emola || process.env.E2_WALLET_EMOLA;
      provider = 'emola';
    }

    if (!wallet_number) {
       return res.status(400).json({ error: `Número da carteira de receção/saída (${provider === 'mpesa' ? 'M-Pesa' : 'e-Mola'}) não configurado.` });
    }

    console.log(`Iniciando transação ${provider.toUpperCase()} para o número ${phone} usando carteira ${wallet_number}`);

    // 1. Obter Token
    let authResponse;
    try {
      authResponse = await fetch('https://mpesaemolatech.com/oauth/token', {
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
      console.error("Erro no Token E2Payments:", fError);
      return res.status(500).json({ error: 'Erro de rede ao contactar E2Payments (Token).', message: fError.message });
    }

    const authContentType = authResponse.headers.get("content-type");
    if (!authContentType || !authContentType.includes("application/json")) {
      const rawAuth = await authResponse.text();
      console.error("Resposta não-JSON no Token:", rawAuth);
      return res.status(500).json({ error: 'E2Payments respondeu com formato inválido no Token.', details: rawAuth });
    }

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.access_token) {
      console.error("Falha na Autenticação E2Payments:", authData);
      return res.status(401).json({ 
        error: 'Falha na autenticação com E2Payments. Verifique Client ID e Secret.',
        details: authData 
      });
    }

    const token = authData.access_token;

    // 2. Criar Pedido de Transação (C2B ou B2C)
    // C2B M-Pesa: /v1/c2b/mpesa-payment/{wallet_id}
    // C2B e-Mola: /v1/c2b/emola-payment/{wallet_id}
    let paymentResponse;
    try {
      const transactionType = type === 'b2c' ? 'b2c' : 'c2b';
      // URL Dinâmica: mpesa-payment ou emola-payment
      const endpoint = `${provider}-payment`;
      const paymentUrl = `https://mpesaemolatech.com/v1/${transactionType}/${endpoint}/${wallet_number}`;
      
      console.log(`Chamando endpoint: ${paymentUrl}`);

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
          phone: phone,
          reference: reference || `EV-${Date.now()}`
        })
      });
    } catch (pError: any) {
      console.error("Erro na Transação E2Payments:", pError);
      return res.status(500).json({ error: 'Erro de rede ao processar transação na E2Payments.', message: pError.message });
    }

    const payContentType = paymentResponse.headers.get("content-type");
    if (!payContentType || !payContentType.includes("application/json")) {
      const rawPay = await paymentResponse.text();
      console.error("Resposta não-JSON na Transação:", rawPay);
      return res.status(500).json({ error: 'E2Payments respondeu com formato inválido na Transação.', details: rawPay });
    }

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("Erro retornado pela E2Payments:", paymentData);
      return res.status(paymentResponse.status || 400).json({ 
        error: paymentData.message || 'Erro ao processar transação na E2Payments.',
        details: paymentData
      });
    }

    return res.status(200).json({
      success: true,
      transactionId: paymentData.transaction_id || paymentData.id,
      message: type === 'b2c' 
        ? 'Saque processado com sucesso! O valor será creditado na sua conta.' 
        : 'Solicitação enviada! Por favor, confirme no seu telemóvel.'
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
