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
import { sendPushNotificationV1 as sendPushNotification, getUserTokens } from '../src/lib/push_v1';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
// Lowtrak integration env vars (global fallback if merchant hasn't configured individually)
const globalLowtrakApiKey = process.env.VITE_LOWTRAK_API_KEY || process.env.LOWTRAK_API_KEY || '';
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

/**
 * Parse NOTIF_META from the transaction description field.
 * Format: "Compra online||NOTIF_META||{json}"
 */
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
 * Webhook Handler for E2Payments
 * This endpoint receives notifications when a transaction status changes.
 * Notifications (Webhook + LowTrack) are fired SERVER-SIDE so any sale from any device is captured.
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
    // Ensure JSON payload (Vercel may provide raw string)
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error('Invalid JSON payload', e);
        return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Invalid JSON payload' });
      }
    }
    console.log('E2Payments Webhook Received:', JSON.stringify(payload, null, 2));

    const { status, reference } = payload;
    const transaction_id = payload.transaction_id || payload.id || payload.transactionId;

    if (!transaction_id && !reference) {
      return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Missing transaction identifiers (id or reference)' });
    }

    // Mapeia o status da E2Payments para o status do nosso painel
    const statusUpper = String(status).toUpperCase();
    const finalStatus = (statusUpper === 'SUCCESSFUL' || statusUpper === 'SUCCESS' || statusUpper === 'CONCLUÍDO') ? 'Concluído' : 'Falhou';

    console.log(`Atualizando transação ${transaction_id} (Ref: ${reference}) para status: ${finalStatus} (Original: ${status})`);

    // Atualiza a transação no Supabase e busca os dados completos
    const { data: updatedTx, error } = await supabase
      .from('transactions')
      .update({ status: finalStatus })
      .eq('id', transaction_id)
      .select()
      .single();

    // Determine user ID from payload or the updated transaction
    const userId = payload.user_id || payload.userId || (updatedTx ? updatedTx.user_id : null) || updatedTx?.customerEmail || updatedTx?.phone;

    if (!error) {
      console.log('Sucesso ao atualizar o status da transação no Supabase por ID.');

      // Wait for all notifications to complete before sending the response
      // Vercel serverless functions freeze execution as soon as res.send is called.
      const notifications: Promise<void>[] = [];

      // 1. Push notification (Pushcut/FCM)
      if (userId) {
        notifications.push((async () => {
          try {
            const tokens = await getUserTokens(userId);
            const val = updatedTx?.amount ? Number(updatedTx.amount).toLocaleString('pt-PT') : '';
            const method = updatedTx?.method || 'Evolux Pay';
            for (const token of tokens) {
              await sendPushNotification(token, {
                title: 'Você recebeu um novo pedido! 🎉',
                body: `Venda aprovada de ${val} MZN ${method}`,
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
              body: JSON.stringify({ transaction_id, amount: updatedTx?.amount, status: finalStatus, user_id: userId }),
            });
          } catch (pcErr) { console.error('Erro ao notificar Pushcut', pcErr); }
        })());
      }

      // Fire merchant-specific notifications for all payments (success or failure)
      const notifMeta = parseNotifMeta(updatedTx?.description || null);
      const val = updatedTx?.amount ? Number(updatedTx.amount).toLocaleString('pt-PT') : '0';
      const payMethod = updatedTx?.method || 'M-Pesa';

      // 3. Merchant Webhook notification
      const merchantWebhookUrl = notifMeta?.webhook_url || defaultMerchantWebhookUrl;
      if (merchantWebhookUrl && merchantWebhookUrl.startsWith('http')) {
        notifications.push((async () => {
          try {
            let webhookEvents: Record<string, boolean> = { sale_approved: true };
            try {
              const eventsStr = notifMeta?.webhook_events || defaultMerchantWebhookEvents;
              webhookEvents = JSON.parse(eventsStr);
            } catch {}
            
            const isSuccess = finalStatus === 'Concluído';
            const eventName = isSuccess ? 'sale_approved' : 'sale_failed';

            // Send if it's a success and sale_approved is enabled, or if it's a failure.
            if ((isSuccess && webhookEvents.sale_approved !== false) || !isSuccess) {
              await fetch(merchantWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: eventName,
                  timestamp: new Date().toISOString(),
                  transaction_id,
                  reference,
                  amount: updatedTx?.amount,
                  method: payMethod,
                  customer: {
                    name: updatedTx?.customerName,
                    email: updatedTx?.customerEmail,
                    phone: updatedTx?.phone
                  },
                  status: finalStatus
                })
              });
              console.log(`Merchant webhook notified (${eventName}) at:`, merchantWebhookUrl);
            }
          } catch (whErr) { console.error('Erro ao notificar Merchant Webhook', whErr); }
        })());
      }

      // 4. LowTrack notification
      const merchantLowtrackToken = notifMeta?.lowtrack_token || await getLowtrackToken();
        console.log('LowTrack debug - token:', merchantLowtrackToken?.substring(0,8), 'endpoint:', lowtrackEndpoint);
        if (merchantLowtrackToken && lowtrackEndpoint) {
          notifications.push((async () => {
            try {
              await fetch(lowtrackEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${merchantLowtrackToken}`,
                  'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify({
                  event: finalStatus === 'Concluído' ? 'sale.approved' : 'sale.failed',
                  transaction_id,
                  reference,
                  amount: updatedTx?.amount,
                  method: payMethod,
                  status: finalStatus,
                  customer: {
                    name: updatedTx?.customerName,
                    email: updatedTx?.customerEmail,
                    phone: updatedTx?.phone
                  },
                  user_id: updatedTx?.customerEmail || updatedTx?.phone || userId
                })
              });
              console.log(`LowTrack notified (${finalStatus}) with token:`, merchantLowtrackToken.substring(0, 8) + '...');
            } catch (lowErr) { console.error('Erro ao notificar LowTrack', lowErr); }
          })());
        }

      await Promise.allSettled(notifications);

      return res.status(200).json({
        message: 'Webhook processed successfully',
        updated: { transaction_id, status: finalStatus, reference }
      });
    }

    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({
      message: 'Webhook processed successfully',
      updated: { transaction_id, status: finalStatus, reference }
    });

  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Internal Server Error' });
  }
}

