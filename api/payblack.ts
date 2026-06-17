import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── PayBlack API ──────────────────────────────────────────────────────────────
// Base URL: https://h.paymoz.tech/api/v1/pagamentos/
// Auth:     Authorization: ApiKey SUA_API_KEY
// C2B M-Pesa:  POST /c2b/pay/      → { msisdn, amount, reference }
// C2B e-Mola:  POST /emola/c2b/pay/ → { msisdn, amount, nome_cliente, reference }
// ──────────────────────────────────────────────────────────────────────────────

const PAYBLACK_BASE = 'https://h.paymoz.tech/api/v1/pagamentos';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  supabaseAnonKey;

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  try { supabase = createClient(supabaseUrl, supabaseAnonKey); } catch {}
}

let supabaseAdmin: any = null;
if (supabaseUrl && supabaseServiceKey) {
  try { supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); } catch {}
}

// ─── Helper: log failed transactions ──────────────────────────────────────────
async function logFailure(
  msisdn: string, amount: number, provider: string,
  reference: string, message: string,
  customerName: string, customerEmail: string, device: string
) {
  if (!supabase) return;
  try {
    await supabase.from('transactions').insert([{
      id: `ERR${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'payment',
      amount: Number(amount || 0),
      phone: msisdn || '000000000',
      method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
      status: 'Falhou',
      reference: reference || `REF${Date.now()}`,
      description: `Compra recusada: ${message}`,
      customerName: customerName || 'Cliente',
      customerEmail: customerEmail || '',
      device: device || 'Desktop',
      createdat: new Date().toISOString(),
    }]);
  } catch (e) {
    console.error('Erro ao persistir falha no Supabase:', e);
  }
}

// ─── Friendly error messages per PayBlack code ────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  'INS-2000': 'Saldo insuficiente. Por favor, recarregue a sua conta e tente novamente.',
  'INS-2001': 'Conta não encontrada. Verifique o número de telemóvel introduzido.',
  'INS-2049': 'Erro interno do M-Pesa. Por favor, tente novamente em instantes.',
  'INT-2000': 'Erro temporário no sistema de pagamentos. Tente novamente.',
  'INT-2001': 'Dados de pagamento inválidos. Verifique os dados e tente novamente.',
  'INT-2002': 'Falha de autenticação com o gateway. Contacte o suporte.',
  'INT-2003': 'Transação não encontrada. Tente novamente.',
  'INT-2004': 'Transação duplicada. Aguarde alguns minutos antes de tentar novamente.',
  'INT-2005': 'Tempo esgotado. Não confirmou o PIN a tempo. Por favor, tente novamente.',
  'INT-2006': 'Valor inválido. O valor mínimo é 1 MT e o máximo é 500.000 MT.',
  'INT-2007': 'Número de telemóvel inválido. Certifique-se de que inclui o prefixo 258.',
};

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  let msisdn = '';
  let amountNum = 0;
  let provider = 'mpesa';
  let reference = `REF${Date.now()}`;
  let customerName = 'Cliente';
  let customerEmail = '';
  let device = 'Desktop';

  try {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    device = isMobile ? 'Mobile' : 'Desktop';

    const body = req.body || {};
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;

    const {
      phone,
      amount,
      customerName: cName,
      customerEmail: cEmail,
      merchant_user_email,
      merchant_webhook_url,
      merchant_webhook_events,
      merchant_lowtrack_token,
    } = parsed;

    if (cName) customerName = cName;
    if (cEmail) customerEmail = cEmail;
    if (parsed.reference) reference = parsed.reference;
    if (amount) amountNum = Number(amount);

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor são obrigatórios.' });
    }

    // ── Sanitize phone → always send as 258XXXXXXXXX (12 digits) ──────────────
    let digits = String(phone).replace(/\D/g, '');
    if (!digits.startsWith('258')) {
      digits = '258' + digits;
    }
    msisdn = digits.slice(0, 12); // e.g. 258841234567

    // ── Detect provider by prefix ─────────────────────────────────────────────
    const localDigits = msisdn.slice(3); // strip 258
    if (localDigits.startsWith('86') || localDigits.startsWith('87')) {
      provider = 'emola';
    }

    // ── PayBlack API key ───────────────────────────────────────────────────────
    const apiKey =
      process.env.PAYBLACK_API_KEY ||
      process.env.VITE_PAYBLACK_API_KEY || '';

    if (!apiKey) {
      const msg = 'PayBlack API Key não configurada no servidor.';
      await logFailure(msisdn, amountNum, provider, reference, msg, customerName, customerEmail, device);
      return res.status(400).json({ error: msg });
    }

    // ── Load merchant settings from Supabase (device-independent) ────────────
    let supabaseWebhookUrl = '';
    let supabaseWebhookEvents = '{}';
    let supabaseLowtrackToken = '';
    const dbClient = supabaseAdmin || supabase;

    if (dbClient && merchant_user_email) {
      try {
        const { data: userSettings } = await dbClient
          .from('user_settings')
          .select('webhook_url, webhook_events, lowtrack_token')
          .eq('user_email', merchant_user_email)
          .single();
        if (userSettings) {
          if (userSettings.webhook_url) supabaseWebhookUrl = userSettings.webhook_url;
          if (userSettings.webhook_events)
            supabaseWebhookEvents =
              typeof userSettings.webhook_events === 'string'
                ? userSettings.webhook_events
                : JSON.stringify(userSettings.webhook_events);
          if (userSettings.lowtrack_token) supabaseLowtrackToken = userSettings.lowtrack_token;
          console.log(`Configurações carregadas do Supabase para: ${merchant_user_email}`);
        }
      } catch (e) {
        console.warn('Erro ao carregar user_settings:', e);
      }
    }

    const finalWebhookUrl = supabaseWebhookUrl || merchant_webhook_url || process.env.VITE_MERCHANT_WEBHOOK_URL || '';
    const finalWebhookEvents =
      supabaseWebhookEvents !== '{}'
        ? supabaseWebhookEvents
        : merchant_webhook_events || process.env.VITE_MERCHANT_WEBHOOK_EVENTS || '{}';
    const finalLowtrackToken =
      supabaseLowtrackToken || merchant_lowtrack_token || process.env.VITE_MERCHANT_LOWTRACK_TOKEN || '';

    // ── Build PayBlack endpoint ───────────────────────────────────────────────
    const endpoint =
      provider === 'emola'
        ? `${PAYBLACK_BASE}/emola/c2b/pay/`
        : `${PAYBLACK_BASE}/c2b/pay/`;

    const payloadBody: Record<string, any> = {
      msisdn,
      amount: amountNum,
      reference: String(reference).slice(0, 100),
    };
    if (provider === 'emola' && customerName) {
      payloadBody.nome_cliente = customerName;
    }

    console.log(`PayBlack → ${endpoint}`, { msisdn, amount: amountNum, provider });

    // ── Call PayBlack ─────────────────────────────────────────────────────────
    let payResponse: Response;
    try {
      payResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `ApiKey ${apiKey}`,
        },
        body: JSON.stringify(payloadBody),
      });
    } catch (fetchErr: any) {
      const msg = `Erro de rede ao contactar PayBlack: ${fetchErr.message}`;
      console.error(msg);
      await logFailure(msisdn, amountNum, provider, reference, msg, customerName, customerEmail, device);
      return res.status(500).json({ error: 'Erro de rede ao processar pagamento. Tente novamente.' });
    }

    // ── Parse response ────────────────────────────────────────────────────────
    const contentType = payResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await payResponse.text();
      console.error('Resposta não-JSON do PayBlack:', raw);
      const msg = 'Gateway respondeu com formato inválido.';
      await logFailure(msisdn, amountNum, provider, reference, msg, customerName, customerEmail, device);
      return res.status(500).json({ error: msg, details: raw.slice(0, 300) });
    }

    const payData = await payResponse.json();
    console.log('PayBlack response:', payData);

    // HTTP 402 = pagamento recusado, 403 = auth error, 400 = bad request
    if (!payResponse.ok || payData.success === false) {
      const code: string = payData.code || '';
      const friendlyMessage =
        ERROR_MESSAGES[code] ||
        payData.message ||
        'Pagamento não processado. Verifique os seus dados e tente novamente.';

      await logFailure(msisdn, amountNum, provider, reference, friendlyMessage, customerName, customerEmail, device);

      return res.status(payResponse.status || 402).json({
        error: friendlyMessage,
        code,
        details: payData,
      });
    }

    // ── SUCCESS ───────────────────────────────────────────────────────────────
    const finalTxId =
      payData.transaction_id ||
      payData.mpesa_transaction_id ||
      payData.emola_txid ||
      reference;

    // Persist successful transaction to Supabase
    if (supabase) {
      try {
        const notifMeta = JSON.stringify({
          webhook_url: finalWebhookUrl,
          webhook_events: finalWebhookEvents,
          lowtrack_token: finalLowtrackToken,
        });

        await supabase.from('transactions').insert([{
          id: finalTxId,
          type: 'payment',
          amount: amountNum,
          phone: msisdn,
          method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
          status: 'Concluído',
          reference,
          description: `Compra online||NOTIF_META||${notifMeta}`,
          customerName,
          customerEmail,
          device,
          createdat: new Date().toISOString(),
        }]);
        console.log('Transação salva no Supabase:', finalTxId);

        // ── Fire notifications ──────────────────────────────────────────────
        const notifications: Promise<any>[] = [];

        // 1. Pushcut Global
        const pushcutEndpoint = process.env.VITE_PUSHCUT_ENDPOINT || process.env.PUSHCUT_ENDPOINT || '';
        const pushcutApiKey = process.env.VITE_PUSHCUT_API_KEY || process.env.PUSHCUT_API_KEY || '';
        if (pushcutEndpoint && pushcutApiKey) {
          notifications.push((async () => {
            try {
              const r = await fetch(pushcutEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pushcutApiKey}` },
                body: JSON.stringify({ transaction_id: finalTxId, amount: amountNum, status: 'Concluído', user_id: customerEmail }),
              });
              console.log('Pushcut Global:', r.status);
            } catch (e: any) { console.error('Pushcut Global erro:', e.message); }
          })());
        }

        // 2. Merchant Webhook (Pushcut / custom)
        if (finalWebhookUrl) {
          notifications.push((async () => {
            try {
              let webhookEvents: Record<string, boolean> = { sale_approved: true };
              try { webhookEvents = JSON.parse(finalWebhookEvents); } catch {}

              if (webhookEvents.sale_approved !== false) {
                const r = await fetch(finalWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'sale_approved',
                    timestamp: new Date().toISOString(),
                    transaction_id: finalTxId,
                    reference,
                    amount: amountNum,
                    method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
                    customer: { name: customerName, email: customerEmail, phone: msisdn },
                    status: 'Concluído',
                  }),
                });
                const resText = await r.text().catch(() => '');
                console.log('Merchant Webhook:', r.status, resText.slice(0, 100));

                // Debug log in DB
                await supabase.from('transactions').insert([{
                  id: `DBG_${Date.now()}`,
                  type: 'payment', amount: 0, phone: '000', method: 'Debug',
                  status: 'Debug', reference: 'Debug',
                  description: `Webhook res: ${r.status} - ${resText.slice(0, 100)}`,
                }]).catch(() => {});
              }
            } catch (e: any) {
              console.error('Merchant Webhook erro:', e.message);
              await supabase.from('transactions').insert([{
                id: `DBG_ERR_${Date.now()}`,
                type: 'payment', amount: 0, phone: '000', method: 'Debug',
                status: 'Debug', reference: 'Debug',
                description: `Webhook err: ${e.message}`,
              }]).catch(() => {});
            }
          })());
        }

        // 3. LowTrack
        const activeLowtrackToken = finalLowtrackToken || process.env.VITE_LOWTRAK_API_KEY || process.env.LOWTRAK_API_KEY || '';
        if (activeLowtrackToken) {
          notifications.push((async () => {
            try {
              const r = await fetch('https://lowtrack.com.br/api/webhook', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${activeLowtrackToken}`,
                  'User-Agent': 'Mozilla/5.0',
                },
                body: JSON.stringify({
                  event: 'sale.approved',
                  transaction_id: finalTxId,
                  reference,
                  amount: amountNum,
                  method: provider === 'emola' ? 'e-Mola' : 'M-Pesa',
                  status: 'Concluído',
                  customer: { name: customerName, email: customerEmail, phone: msisdn },
                }),
              });
              console.log('LowTrack:', r.status);
            } catch (e: any) { console.error('LowTrack erro:', e.message); }
          })());
        }

        await Promise.allSettled(notifications);
        console.log('Todas as notificações processadas.');
      } catch (dbErr) {
        console.error('Erro ao salvar transação/disparar notificações:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      transactionId: finalTxId,
      mpesa_transaction_id: payData.mpesa_transaction_id || null,
      emola_txid: payData.emola_txid || null,
      message: 'Pagamento processado com sucesso!',
    });

  } catch (error: any) {
    console.error('Erro Fatal PayBlack:', error);
    await logFailure(msisdn, amountNum, provider, reference, `Erro crítico: ${error.message}`, customerName, customerEmail, device);
    return res.status(500).json({
      error: 'Erro fatal no servidor de pagamento.',
      message: error.message,
    });
  }
}
