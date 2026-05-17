import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Webhook Handler for E2Payments
 * This endpoint receives notifications when a transaction status changes.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
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
        // O status de sucesso da E2Payments é 'SUCCESSFUL'
        const finalStatus = status === 'SUCCESSFUL' ? 'Concluído' : 'Falhou';

        console.log(`Atualizando transação ${transaction_id} (Ref: ${reference}) para status: ${finalStatus}`);

        // Atualiza a transação no Supabase
        const { data, error } = await supabase
            .from('transactions')
            .update({ status: finalStatus })
            .eq('id', transaction_id);

        if (error) {
            console.error('Erro ao atualizar transação no Supabase por ID:', error);
            // Tenta atualizar usando a referência como fallback
            if (reference) {
                const { error: refError } = await supabase
                    .from('transactions')
                    .update({ status: finalStatus })
                    .eq('reference', reference);
                if (refError) {
                    console.error('Erro no fallback por referência:', refError);
                } else {
                    console.log('Sucesso ao atualizar o status da transação pelo fallback de referência.');
                }
            }
        } else {
            console.log('Sucesso ao atualizar o status da transação no Supabase por ID.');
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
