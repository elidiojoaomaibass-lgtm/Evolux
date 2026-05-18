import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Garantir que temos o body
    const body = req.body || {};
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;

    const { 
      phone, 
      amount, 
      reference, 
      client_id, 
      client_secret, 
      wallet_mpesa, 
      wallet_emola, 
      type = 'c2b',
      customerName = 'Cliente',
      customerEmail = '',
      description = ''
    } = parsedBody;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor são obrigatórios.' });
    }

    // Sanitizar número de telefone
    let digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('258') && digits.length > 9) {
      digits = digits.substring(3);
    }
    const sanitizedPhone = digits.slice(0, 9);

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
    if (sanitizedPhone.startsWith('86') || sanitizedPhone.startsWith('87')) {
      wallet_number = wallet_emola || process.env.E2_WALLET_EMOLA;
      provider = 'emola';
    }

    if (!wallet_number) {
       return res.status(400).json({ error: `Número da carteira de receção/saída (${provider === 'mpesa' ? 'M-Pesa' : 'e-Mola'}) não configurado.` });
    }

    console.log(`Iniciando transação ${provider.toUpperCase()} para o número ${sanitizedPhone} usando carteira ${wallet_number}`);

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
    let paymentResponse;
    try {
      const transactionType = type === 'b2c' ? 'b2c' : 'c2b';
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
          amount: String(amount),
          phone: String(sanitizedPhone),
          reference: String(reference || `EV${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
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

    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const device = isMobile ? 'Mobile' : 'Desktop';

    if (!paymentResponse.ok) {
      console.error("Erro retornado pela E2Payments:", paymentData);
      
      const mpesaResponse = paymentData.mpesa_server_response || paymentData.emola_server_response || {};
      const responseCode = mpesaResponse.output_ResponseCode || '';
      const responseDesc = (mpesaResponse.output_ResponseDesc || '').toLowerCase();

      const errorMessages: Record<string, string> = {
        'INS-2006': 'Saldo insuficiente. Por favor, recarregue a sua conta M-Pesa e tente novamente.',
        'INS-6':    'Saldo insuficiente. Por favor, verifique o saldo e tente novamente.',
        'INS-5':    'Pagamento cancelado. Não introduziu o PIN no seu telemóvel. Tente novamente e confirme o PIN quando solicitado.',
        'INS-17':   'Pagamento cancelado ou recusado. Tente novamente e confirme o PIN quando solicitado.',
        'INS-9':    'Tempo esgotado. Não confirmou o PIN a tempo. Por favor, tente novamente.',
        'INS-14':   'Número de telemóvel inválido. Verifique o número introduzido e tente novamente.',
        'INS-2':    'Número de telemóvel não encontrado. Verifique se é um número M-Pesa válido.',
        'INS-3':    'Número de destino inválido. Por favor, verifique o número e tente novamente.',
        'INS-13':   'Valor inválido. O valor mínimo é 1 MT e o máximo é 1.250.000 MT.',
        'INS-10':   'Transação duplicada. Aguarde alguns minutos antes de tentar novamente.',
        'INS-19':   'Erro de referência. Por favor, tente novamente.',
        'INS-15':   'Erro de referência. Por favor, tente novamente.',
        'INS-4':    'Não foi possível enviar o pedido ao seu telemóvel. Verifique se tem M-Pesa ativo e tente novamente.',
        'INS-1':    'Erro temporário no sistema. Por favor, tente novamente em instantes.',
        'INS-20':   'Erro temporário no sistema. Por favor, tente novamente em instantes.',
      };

      let friendlyMessage = errorMessages[responseCode];

      if (!friendlyMessage) {
        if (responseDesc.includes('insufficient') || responseDesc.includes('balance') || responseDesc.includes('saldo')) {
          friendlyMessage = 'Saldo insuficiente. Por favor, recarregue a sua conta e tente novamente.';
        } else if (responseDesc.includes('cancel') || responseDesc.includes('reject') || responseDesc.includes('refused')) {
          friendlyMessage = 'Pagamento cancelado. Tente novamente e confirme o PIN quando solicitado.';
        } else if (responseDesc.includes('timeout') || responseDesc.includes('time out') || responseDesc.includes('expired')) {
          friendlyMessage = 'Tempo esgotado. Não confirmou o PIN a tempo. Tente novamente.';
        } else if (responseDesc.includes('invalid') && responseDesc.includes('number')) {
          friendlyMessage = 'Número de telemóvel inválido. Verifique e tente novamente.';
        } else {
          friendlyMessage = 'Pagamento não processado. Verifique os seus dados e tente novamente.';
        }
      }

      // Salvar falha no Supabase imediatamente para C2B
      if (type !== 'b2c') {
        try {
          await supabase.from('transactions').insert([{
            id: `ERR${Date.now()}`,
            type: 'payment',
            amount: Number(amount),
            phone: sanitizedPhone,
            method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
            status: 'Falhou',
            reference: reference || `REF${Date.now()}`,
            description: description || `Compra recusada: ${friendlyMessage}`,
            customerName: customerName,
            customerEmail: customerEmail,
            device: device,
            createdAt: new Date().toISOString()
          }]);
          console.log('Transação de erro persistida com sucesso no Supabase.');
        } catch (dbErr) {
          console.error("Erro ao registrar falha de transação no Supabase:", dbErr);
        }
      }

      return res.status(paymentResponse.status || 400).json({ 
        error: friendlyMessage,
        code: responseCode,
        details: paymentData
      });
    }

    // Salvar transação de sucesso (Pendente) no Supabase
    try {
      await supabase.from('transactions').insert([{
        id: paymentData.transaction_id || paymentData.id || reference,
        type: type === 'b2c' ? 'withdrawal' : 'payment',
        amount: Number(amount),
        phone: sanitizedPhone,
        method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
        status: 'Pendente',
        reference: reference || `REF${Date.now()}`,
        description: description || (type === 'b2c' ? 'Levantamento de Saldo' : `Compra online`),
        customerName: customerName,
        customerEmail: customerEmail,
        device: device,
        createdAt: new Date().toISOString()
      }]);
      console.log('Transação pendente persistida com sucesso no Supabase.');
    } catch (dbErr) {
      console.error("Erro ao registrar transação pendente no Supabase:", dbErr);
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

    // Salvar falha fatal no Supabase imediatamente para C2B
    try {
      const body = req.body || {};
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      const { phone, amount, reference, customerName = 'Cliente', customerEmail = '', description = '', type = 'c2b' } = parsedBody;
      
      let digits = String(phone || '').replace(/\D/g, '');
      if (digits.startsWith('258') && digits.length > 9) {
        digits = digits.substring(3);
      }
      const sanitizedPhone = digits.slice(0, 9);
      
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const device = isMobile ? 'Mobile' : 'Desktop';

      if (type !== 'b2c' && sanitizedPhone && amount) {
        await supabase.from('transactions').insert([{
          id: `ERR_FATAL_${Date.now()}`,
          type: 'payment',
          amount: Number(amount),
          phone: sanitizedPhone,
          method: (sanitizedPhone.startsWith('86') || sanitizedPhone.startsWith('87')) ? 'e-Mola' : 'M-Pesa',
          status: 'Falhou',
          reference: reference || `REF${Date.now()}`,
          description: description || `Erro fatal de pagamento: ${error.message || 'Erro no servidor'}`,
          customerName: customerName,
          customerEmail: customerEmail,
          device: device,
          createdAt: new Date().toISOString()
        }]);
        console.log('Transação de erro fatal persistida com sucesso no Supabase.');
      }
    } catch (dbErr) {
      console.error("Erro ao salvar falha fatal no Supabase:", dbErr);
    }

    return res.status(500).json({ 
      error: 'Erro fatal no servidor de pagamento.',
      message: error.message,
      stack: error.stack
    });
  }
}
