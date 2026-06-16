// Enable CORS for any origin (adjust as needed)
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};
import { createClient } from '@supabase/supabase-js';
import { sendPushNotificationV1 as sendPushNotification, getUserTokens } from '../src/lib/push_v1';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
// Lowtrak integration env vars
const lowtrakEndpoint = process.env.VITE_LOWTRAK_ENDPOINT || process.env.LOWTRAK_ENDPOINT || 'https://lowtrack.com.br/api/webhook';
const lowtrakApiKey = process.env.VITE_LOWTRAK_API_KEY || process.env.LOWTRAK_API_KEY || '';
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
 * Webhook Handler for E2Payments
 * This endpoint receives notifications when a transaction status changes.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    console.error('Supabase client is not configured in webhook.');
    return res.status(500).json({ error: 'Supabase environment variables are missing on Vercel.' });
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
      return res.status(400).json({ error: 'Missing transaction identifiers (id or reference)' });
    }

    // Mapeia o status da E2Payments para o status do nosso painel
    // O status de sucesso da E2Payments é 'SUCCESSFUL', mas pode vir em minúsculo
    const statusUpper = String(status).toUpperCase();
    const finalStatus = (statusUpper === 'SUCCESSFUL' || statusUpper === 'SUCCESS' || statusUpper === 'CONCLUÍDO') ? 'Concluído' : 'Falhou';

    console.log(`Atualizando transação ${transaction_id} (Ref: ${reference}) para status: ${finalStatus} (Original: ${status})`);

    // Atualiza a transação no Supabase
    const { data: updatedTx, error } = await supabase
      .from('transactions')
      .update({ status: finalStatus })
      .eq('id', transaction_id)
      .select()
      .single();

    // Determine user ID from payload or the updated transaction
    const userId = payload.user_id || payload.userId || (updatedTx ? updatedTx.user_id : null);

      if (!error) {
        console.log('Sucesso ao atualizar o status da transação no Supabase por ID.');
        // Send response immediately
        res.status(200).json({
          message: 'Webhook processed successfully',
          updated: { transaction_id, status: finalStatus, reference },
        });
        // Fire-and-forget notification handling
        (async () => {
          if (userId) {
            try {
              const tokens = await getUserTokens(userId);
              const val = updatedTx?.amount ? Number(updatedTx.amount).toLocaleString('pt-PT') : '';
              const method = updatedTx?.method || 'Evolux Pay';
              for (const token of tokens) {
                await sendPushNotification(token, {
                  title: 'Você recebeu um novo pedido! 🎉',
                  body: `from Prod\nVenda aprovada de ${val} MZN ${method}`,
                });
              }
            } catch (e) { console.error('Erro ao enviar notificação push', e); }
          }
          // Lowtrak notification
          try {
            if (lowtrakEndpoint && lowtrakApiKey) {
              await fetch(lowtrakEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lowtrakApiKey}` },
                body: JSON.stringify({ transaction_id, amount: updatedTx?.amount, status: finalStatus, user_id: userId }),
              });
            }
          } catch (lowErr) {
            console.error('Erro ao notificar Lowtrak', lowErr);
          }
          // Pushcut notification
          try {
            if (pushcutEndpoint && pushcutApiKey) {
              await fetch(pushcutEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pushcutApiKey}` },
                body: JSON.stringify({ transaction_id, amount: updatedTx?.amount, status: finalStatus, user_id: userId }),
              });
            }
          } catch (pcErr) {
            console.error('Erro ao notificar Pushcut', pcErr);
          }
        })();
        // End early; further code will not execute after response
        return;
      }
    return res.status(200).json({
      message: 'Webhook processed successfully',
      updated: { transaction_id, status: finalStatus, reference }
    });

  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
