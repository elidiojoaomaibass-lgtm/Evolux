// Enable CORS for any origin (adjust as needed)
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();
import { sendPushNotificationV1 as sendPushNotification, getUserTokens } from '../src/lib/push_v1';
import { getLowtrackToken } from '../src/lib/lowtrack';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const globalLowtrakApiKey = process.env.VITE_LOWTRAK_API_KEY || process.env.LOWTRAK_API_KEY || '';
const lowtrackEndpoint = process.env.VITE_LOWTRAK_ENDPOINT || process.env.LOWTRAK_ENDPOINT || 'https://lowtrack.com.br/api/webhook';
const defaultMerchantWebhookUrl = process.env.VITE_MERCHANT_WEBHOOK_URL || '';
const defaultMerchantWebhookEvents = process.env.VITE_MERCHANT_WEBHOOK_EVENTS || '{}';
const pushcutEndpoint = process.env.VITE_PUSHCUT_ENDPOINT || process.env.PUSHCUT_ENDPOINT || '';
const pushcutApiKey = process.env.VITE_PUSHCUT_API_KEY || process.env.PUSHCUT_API_KEY || '';

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Erro ao inicializar Supabase no webhook:', e);
  }
}

function parseNotifMeta(description: string | null): { webhook_url: string; webhook_events: string; lowtrack_token: string } | null {
  if (!description) return null;
  const marker = '||NOTIF_META||';
  const idx = description.indexOf(marker);
  if (idx === -1) return null;
  try {
    return JSON.parse(description.substring(idx + marker.length));
  } catch (e) {
    return null;
  }
}

/**
 * Webhook Handler for RLX Gateway
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    console.error('Supabase client is not configured in webhook.');
    return res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Supabase environment variables are missing on Vercel.' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) {
        return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Invalid JSON payload' });
      }
    }
    console.log('RLX Webhook Received:', JSON.stringify(payload, null, 2));

    // RLX Webhook structure support + fallback for other formats
    const status = payload.status || payload.event;
    const transaction_id = payload.txid || payload.transaction_id || payload.id || payload.transactionId;
    const reference = payload.reference || transaction_id;
    const amount = payload.valor_bruto || payload.amount;
    const phone = payload.pagador || payload.phone;
    const customerName = payload.nome_pagador || payload.customerName || 'Cliente';
    const method = payload.canal === 'emola' ? 'e-Mola' : (payload.canal === 'mpesa' ? 'M-Pesa' : payload.method);

    if (!transaction_id) {
      return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Missing txid / transaction_id' });
    }

    const isSuccess = (status === 'success' || status === 'payment.success' || String(status).toUpperCase() === 'CONCLUÍDO');
    const finalStatus = isSuccess ? 'Concluído' : 'Falhou';

    console.log(`Atualizando transação ${transaction_id} para status: ${finalStatus}`);

    const { data: updatedTx, error } = await supabase
      .from('transactions')
      .update({ status: finalStatus })
      .eq('id', transaction_id)
      .select()
      .single();

    if (!error) {
      console.log('Sucesso ao atualizar a transação no Supabase.');

      // Se for sucesso, atualizar vendas do produto (se existir metadado)
      if (isSuccess && updatedTx && updatedTx.description) {
          // Ex: "Compra: Nome do Produto"
          // O webhook não tem o product_id diretamente, mas o ideal seria o client enviar no momento do inicio do pagamento.
          // Para já, este webhook servirá para confirmação de notificação e state.
          console.log("Transação confirmada. Dispatch de eventos iniciado.");
      }

      const userId = payload.user_id || payload.userId || updatedTx?.customerEmail || updatedTx?.phone;
      const notifications: Promise<void>[] = [];

      // 1. Push notification (Pushcut/FCM)
      if (userId) {
        notifications.push((async () => {
          try {
            const tokens = await getUserTokens(userId);
            const val = amount ? Number(amount).toLocaleString('pt-PT') : '';
            for (const token of tokens) {
              await sendPushNotification(token, {
                title: isSuccess ? '🤑 Venda Aprovada!' : '⚠️ Venda Falhada',
                body: isSuccess ? `Você realizou uma nova venda no valor de ${val} (Via ${method || 'RLX'})` : `A transação de ${val} falhou.`,
              });
            }
          } catch (e) { console.error('Erro ao enviar notificação push', e); }
        })());
      }

      // 2. Pushcut notification (global)
      if (pushcutEndpoint && pushcutApiKey) {
        notifications.push((async () => {
          try {
            await fetch(pushcutEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pushcutApiKey}` },
              body: JSON.stringify({ transaction_id, amount, status: finalStatus, user_id: userId }),
            });
          } catch (pcErr) { console.error('Erro ao notificar Pushcut', pcErr); }
        })());
      }

      // 3. Merchant Webhook & LowTrack
      const notifMeta = parseNotifMeta(updatedTx?.description || null);
      const merchantWebhookUrl = notifMeta?.webhook_url || defaultMerchantWebhookUrl;
      const merchantLowtrackToken = notifMeta?.lowtrack_token || globalLowtrakApiKey;

      if (merchantWebhookUrl && merchantWebhookUrl.startsWith('http')) {
        notifications.push((async () => {
          try {
            let webhookEvents: Record<string, boolean> = { sale_approved: true };
            if (notifMeta?.webhook_events) { try { webhookEvents = JSON.parse(notifMeta.webhook_events); } catch {} }
            const eventName = isSuccess ? 'sale_approved' : 'sale_failed';

            if ((isSuccess && webhookEvents.sale_approved !== false) || !isSuccess) {
              await fetch(merchantWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: eventName,
                  timestamp: new Date().toISOString(),
                  transaction_id, reference, amount, method,
                  customer: { name: customerName, phone },
                  status: finalStatus
                })
              });
            }
          } catch (whErr) { console.error('Erro Merchant Webhook', whErr); }
        })());
      }

      if (merchantLowtrackToken && lowtrackEndpoint) {
        notifications.push((async () => {
          try {
            await fetch(lowtrackEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${merchantLowtrackToken}`, 'User-Agent': 'Mozilla/5.0' },
              body: JSON.stringify({
                event: isSuccess ? 'sale.approved' : 'sale.failed',
                transaction_id, reference, amount, method, status: finalStatus,
                customer: { name: customerName, phone },
                user_id: userId
              })
            });
          } catch (lowErr) { console.error('Erro LowTrack', lowErr); }
        })());
      }

      await Promise.allSettled(notifications);

      return res.status(200).json({
        message: 'Webhook processed successfully',
        updated: { transaction_id, status: finalStatus, reference }
      });
    } else {
        // Even if tx update fails, respond 200 to gateway so it doesn't retry infinitely
        console.error('Failed to update tx in DB:', error);
        return res.status(200).json({ message: 'Received, but failed to update DB.', error: error });
    }

  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Internal Server Error' });
  }
}
