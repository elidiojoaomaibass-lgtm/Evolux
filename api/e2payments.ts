import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
// Service Role Key bypasses RLS — required for backend to read any user's settings
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Erro ao inicializar Supabase no e2payments:', e);
  }
}

// Admin client with Service Role Key to bypass RLS when reading merchant settings
let supabaseAdmin: any = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  } catch (e) {
    console.error('Erro ao inicializar Supabase Admin:', e);
  }
}

// Helper central para registar falhas no Supabase em qualquer cenário
async function logFailure(
  sanitizedPhone: string,
  amount: number,
  provider: string,
  reference: string,
  friendlyMessage: string,
  customerName: string,
  customerEmail: string,
  device: string,
  type: string
) {
  if (type === 'b2c') return; // Saques não são registados como falhas de compra
  if (!supabase) {
    console.warn('Supabase não configurado no backend. Impossível persistir log de falha.');
    return;
  }
  try {
    await supabase.from('transactions').insert([{
      id: `ERR${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'payment',
      amount: Number(amount || 0),
      phone: sanitizedPhone || '000000000',
      method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
      status: 'Falhou',
      reference: reference || `REF${Date.now()}`,
      description: `Compra recusada: ${friendlyMessage}`,
      customerName: customerName || 'Cliente',
      customerEmail: customerEmail || '',
      device: device || 'Desktop',
      createdat: new Date().toISOString()
    }]);
    console.log('Transação de erro persistida com sucesso no Supabase.');
  } catch (dbErr) {
    console.error("Erro ao registrar falha de transação no Supabase:", dbErr);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // Valores padrão para log de falhas precoce
  let sanitizedPhone = '';
  let amountNum = 0;
  let provider = 'mpesa';
  let reference = `REF${Date.now()}`;
  let customerName = 'Cliente';
  let customerEmail = '';
  let type = 'c2b';
  let device = 'Desktop';

  try {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    device = isMobile ? 'Mobile' : 'Desktop';

    const body = req.body || {};
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;

    const { 
      phone, 
      amount, 
      client_id, 
      client_secret, 
      wallet_mpesa, 
      wallet_emola,
      customerName: cName,
      customerEmail: cEmail,
      merchant_webhook_url,
      merchant_webhook_events,
      merchant_lowtrack_token,
      merchant_user_email
    } = parsedBody;

    // Priority 1: Try to load merchant settings from Supabase using admin client (bypasses RLS)
    let supabaseWebhookUrl = '';
    let supabaseWebhookEvents = '{}';
    let supabaseLowtrackToken = '';
    const dbClient = supabaseAdmin || supabase; // prefer admin client that bypasses RLS
    if (dbClient && merchant_user_email) {
      try {
        const { data: userSettings, error: settingsError } = await dbClient
          .from('user_settings')
          .select('webhook_url, webhook_events, lowtrack_token')
          .eq('user_email', merchant_user_email)
          .single();
        if (settingsError) {
          console.warn('Erro ao carregar user_settings:', settingsError.message);
        }
        if (userSettings) {
          if (userSettings.webhook_url) supabaseWebhookUrl = userSettings.webhook_url;
          if (userSettings.webhook_events) supabaseWebhookEvents = typeof userSettings.webhook_events === 'string' ? userSettings.webhook_events : JSON.stringify(userSettings.webhook_events);
          if (userSettings.lowtrack_token) supabaseLowtrackToken = userSettings.lowtrack_token;
          console.log(`Configurações do merchant carregadas do Supabase para: ${merchant_user_email}`);
        } else {
          console.warn(`Nenhuma configuração encontrada no Supabase para: ${merchant_user_email}`);
        }
      } catch (settingsErr) {
        console.warn('Erro ao carregar user_settings do Supabase:', settingsErr);
      }
    }

    // Priority 2: Fallback to client-sent values (from localStorage on merchant device)
    // Priority 3: Fallback to global env vars
    const fallbackWebhookUrl = process.env.VITE_MERCHANT_WEBHOOK_URL || '';
    const fallbackWebhookEvents = process.env.VITE_MERCHANT_WEBHOOK_EVENTS || '{}';
    const fallbackLowtrackToken = process.env.VITE_MERCHANT_LOWTRACK_TOKEN || '';
    const finalWebhookUrl = supabaseWebhookUrl || merchant_webhook_url || fallbackWebhookUrl;
    const finalWebhookEvents = supabaseWebhookEvents !== '{}' ? supabaseWebhookEvents : (merchant_webhook_events || fallbackWebhookEvents);
    const finalLowtrackToken = supabaseLowtrackToken || merchant_lowtrack_token || fallbackLowtrackToken;

    if (parsedBody.type) type = parsedBody.type;
    if (parsedBody.reference) reference = parsedBody.reference;
    if (cName) customerName = cName;
    if (cEmail) customerEmail = cEmail;
    if (amount) amountNum = Number(amount);

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor são obrigatórios.' });
    }

    // Sanitizar número de telefone
    let digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('258') && digits.length > 9) {
      digits = digits.substring(3);
    }
    sanitizedPhone = digits.slice(0, 9);

    const final_client_id = (client_id || process.env.E2_CLIENT_ID || '').trim();
    const final_client_secret = (client_secret || process.env.E2_CLIENT_SECRET || '').trim();

    // Deteção do provider baseado no prefixo
    if (sanitizedPhone.startsWith('86') || sanitizedPhone.startsWith('87')) {
      provider = 'emola';
    }

    if (!final_client_id || !final_client_secret) {
      const friendly = 'Credenciais E2Payments (Client ID/Secret) não configuradas.';
      await logFailure(sanitizedPhone, amountNum, provider, reference, friendly, customerName, customerEmail, device, type);
      return res.status(400).json({ error: friendly });
    }

    // Selecionar carteira correta
    let wallet_number = provider === 'emola' 
      ? (wallet_emola || process.env.E2_WALLET_EMOLA)
      : (wallet_mpesa || process.env.E2_WALLET_MPESA);

    if (!wallet_number) {
       const friendly = `Número da carteira de receção (${provider === 'mpesa' ? 'M-Pesa' : 'e-Mola'}) não configurado.`;
       await logFailure(sanitizedPhone, amountNum, provider, reference, friendly, customerName, customerEmail, device, type);
       return res.status(400).json({ error: friendly });
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
      const friendly = 'Erro de rede ao contactar E2Payments (Token).';
      await logFailure(sanitizedPhone, amountNum, provider, reference, `${friendly}: ${fError.message}`, customerName, customerEmail, device, type);
      return res.status(500).json({ error: friendly, message: fError.message });
    }

    const authContentType = authResponse.headers.get("content-type");
    if (!authContentType || !authContentType.includes("application/json")) {
      const rawAuth = await authResponse.text();
      console.error("Resposta não-JSON no Token:", rawAuth);
      const friendly = 'E2Payments respondeu com formato inválido no Token.';
      await logFailure(sanitizedPhone, amountNum, provider, reference, friendly, customerName, customerEmail, device, type);
      return res.status(500).json({ error: friendly, details: rawAuth });
    }

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.access_token) {
      console.error("Falha na Autenticação E2Payments:", authData);
      const friendly = 'Falha na autenticação com E2Payments. Verifique Client ID e Secret.';
      await logFailure(sanitizedPhone, amountNum, provider, reference, friendly, customerName, customerEmail, device, type);
      return res.status(401).json({ 
        error: friendly,
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
          amount: String(amountNum),
          phone: String(sanitizedPhone),
          reference: String(reference).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
        })
      });
    } catch (pError: any) {
      console.error("Erro na Transação E2Payments:", pError);
      const friendly = 'Erro de rede ao processar transação na E2Payments.';
      await logFailure(sanitizedPhone, amountNum, provider, reference, `${friendly}: ${pError.message}`, customerName, customerEmail, device, type);
      return res.status(500).json({ error: friendly, message: pError.message });
    }

    const payContentType = paymentResponse.headers.get("content-type");
    if (!payContentType || !payContentType.includes("application/json")) {
      const rawPay = await paymentResponse.text();
      console.error("Resposta não-JSON na Transação:", rawPay);
      const friendly = 'E2Payments respondeu com formato inválido na Transação.';
      await logFailure(sanitizedPhone, amountNum, provider, reference, friendly, customerName, customerEmail, device, type);
      return res.status(500).json({ error: friendly, details: rawPay });
    }

    const paymentData = await paymentResponse.json();

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

      await logFailure(sanitizedPhone, amountNum, provider, reference, friendlyMessage, customerName, customerEmail, device, type);

      return res.status(paymentResponse.status || 400).json({ 
        error: friendlyMessage,
        code: responseCode,
        details: paymentData
      });
    }

    // Salvar transação de sucesso (Pendente) no Supabase
    if (supabase) {
      try {
        const notifMeta = JSON.stringify({
          webhook_url: finalWebhookUrl,
          webhook_events: finalWebhookEvents,
          lowtrack_token: finalLowtrackToken
        });
        
        // As E2Payments is a synchronous API and doesn't support webhooks,
        // if we reached here, the transaction is successfully completed.
        const finalStatus = 'Concluído';
        const finalTxId = paymentData.transaction_id || paymentData.id || reference;
        
        await supabase.from('transactions').insert([{
          id: finalTxId,
          type: type === 'b2c' ? 'withdrawal' : 'payment',
          amount: amountNum,
          phone: sanitizedPhone,
          method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
          status: finalStatus,
          reference: reference || `REF${Date.now()}`,
          description: type === 'b2c' ? 'Levantamento de Saldo' : `Compra online||NOTIF_META||${notifMeta}`,
          customerName: customerName,
          customerEmail: customerEmail,
          device: device,
          createdat: new Date().toISOString()
        }]);
        console.log('Transação concluída salva com sucesso no Supabase.');

        // ==========================================
        // DISPARAR NOTIFICAÇÕES IMEDIATAMENTE (Já que não há webhook)
        // ==========================================
        if (type !== 'b2c') {
          console.log('Iniciando disparos de notificações...');
          const notifications: Promise<any>[] = [];
          
          // 1. Pushcut Global
          const pushcutEndpoint = process.env.VITE_PUSHCUT_ENDPOINT || process.env.PUSHCUT_ENDPOINT || '';
          const pushcutApiKey = process.env.VITE_PUSHCUT_API_KEY || process.env.PUSHCUT_API_KEY || '';
          if (pushcutEndpoint && pushcutApiKey) {
            console.log('Adicionando Pushcut Global à fila de disparos.');
            notifications.push((async () => {
              try {
                const res = await fetch(pushcutEndpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pushcutApiKey}` },
                  body: JSON.stringify({ transaction_id: finalTxId, amount: amountNum, status: finalStatus, user_id: customerEmail }),
                });
                console.log('Pushcut Global disparado. Status:', res.status);
              } catch (err: any) { console.error('Erro no Pushcut Global:', err.message || err); }
            })());
          }

          // 2. Pushcut Cliente (Merchant Webhook)
          if (finalWebhookUrl) {
            console.log('Adicionando Webhook do Cliente à fila de disparos:', finalWebhookUrl);
            notifications.push((async () => {
              try {
                let webhookEvents: Record<string, boolean> = { sale_approved: true };
                try { webhookEvents = JSON.parse(finalWebhookEvents); } catch {}
                
                if (webhookEvents.sale_approved !== false) {
                  const res = await fetch(finalWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: 'sale_approved',
                      timestamp: new Date().toISOString(),
                      transaction_id: finalTxId,
                      reference: reference,
                      amount: amountNum,
                      method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
                      customer: { name: customerName, email: customerEmail, phone: sanitizedPhone },
                      status: finalStatus
                    })
                  });
                  console.log('Webhook do Cliente disparado. Status:', res.status);
                  const resText = await res.text().catch(() => '');
                  await supabase.from('transactions').insert([{
                    id: `DBG_${Date.now()}`,
                    type: 'payment', amount: 0, phone: '000', method: 'Debug', status: 'Debug', reference: 'Debug',
                    description: `Pushcut res: ${res.status} - ${resText.slice(0, 100)}`
                  }]);
                } else {
                  console.log('Evento de venda aprovada desativado nas configurações do webhook do merchant.');
                }
              } catch (err: any) { 
                console.error('Erro no Webhook do Cliente:', err.message || err); 
                await supabase.from('transactions').insert([{
                  id: `DBG_ERR_${Date.now()}`,
                  type: 'payment', amount: 0, phone: '000', method: 'Debug', status: 'Debug', reference: 'Debug',
                  description: `Pushcut err: ${err.message}`
                }]);
              }
            })());
          }

          // 3. LowTrack
          const globalLowtrakApiKey = 
            process.env.VITE_LOWTRAK_API_KEY ||
            process.env.LOWTRAK_API_KEY || '';
          const activeLowtrackToken = finalLowtrackToken || globalLowtrakApiKey;
          if (activeLowtrackToken) {
            console.log('Adicionando LowTrack à fila de disparos.');
            notifications.push((async () => {
              try {
                const res = await fetch('https://lowtrack.com.br/api/webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeLowtrackToken}`, 'User-Agent': 'Mozilla/5.0' },
                  body: JSON.stringify({
                    event: 'sale.approved',
                    transaction_id: finalTxId,
                    reference: reference,
                    amount: amountNum,
                    method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
                    status: finalStatus,
                    customer: { name: customerName, email: customerEmail, phone: sanitizedPhone },
                    user_id: customerEmail
                  }),
                });
                console.log('LowTrack disparado. Status:', res.status);
              } catch (err: any) { console.error('Erro no LowTrack:', err.message || err); }
            })());
          }

          // Aguarda os disparos iniciarem e finalizarem
          await Promise.allSettled(notifications);
          console.log('Todos os disparos de notificações processados.');
        }

      } catch (dbErr) {
        console.error("Erro ao registrar transação no Supabase ou disparar integrações:", dbErr);
      }
    } else {
      console.warn("Supabase não configurado no backend. Transação concluída sem persistência.");
    }

    return res.status(200).json({
      success: true,
      transactionId: paymentData.transaction_id || paymentData.id,
      message: type === 'b2c' 
        ? 'Saque processado com sucesso! O valor será creditado na sua conta.' 
        : 'Pagamento processado com sucesso e integrações disparadas!'
    });

  } catch (error: any) {
    console.error("Erro Fatal E2Payments:", error);

    // Salvar falha fatal no Supabase imediatamente para C2B
    await logFailure(sanitizedPhone, amountNum, provider, reference, `Erro crítico: ${error.message || 'Erro de processamento'}`, customerName, customerEmail, device, type);

    return res.status(500).json({ 
      error: 'Erro fatal no servidor de pagamento.',
      message: error.message,
      stack: error.stack
    });
  }
}
