import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotificationV1 as sendPushNotification, getUserTokens } from '../src/lib/push_v1';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    console.error('Supabase client is not configured in webhook.');
    return res.status(500).json({ error: 'Supabase environment variables are missing on Vercel.' });
  }

  try {
    const payload = req.body;
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
      // Send push notification to user if userId available
      if (userId) {
        try {
          const tokens = await getUserTokens(userId);
          const val = updatedTx?.amount ? Number(updatedTx.amount).toLocaleString('pt-PT') : '';
          const method = updatedTx?.method || 'Evolux Pay';
          
          for (const token of tokens) {
            await sendPushNotification(token, {
              title: 'Você recebeu um novo pedido! 🎉',
              body: val ? `Gerado por ${method}\nNo Valor de ${val} MZN - Evolux Pay` : `Sua venda ${transaction_id} foi concluída com sucesso!`,
            });
          }
        } catch (e) {
          console.error('Erro ao enviar notificação push', e);
        }
      }
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
