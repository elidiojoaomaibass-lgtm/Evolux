import { VercelRequest, VercelResponse } from '@vercel/node';

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

        // The payload usually contains:
        // {
        //   "transaction_id": "...",
        //   "status": "SUCCESSFUL" | "FAILED",
        //   "reference": "...",
        //   "amount": ...,
        //   ...
        // }

        const { transaction_id, status, reference } = payload;

        if (!transaction_id) {
            return res.status(400).json({ error: 'Missing transaction_id' });
        }

        // IMPORTANT: In a real app, you would verify the signature/source of this request.
        // And you would update your DATABASE (Supabase) here.
        
        // Example logic for updating Supabase (if configured):
        /*
        const { data, error } = await supabase
            .from('transactions')
            .update({ status: status === 'SUCCESSFUL' ? 'Concluído' : 'Falhou' })
            .eq('id', transaction_id);
        */

        // Since we are currently using localStorage for the frontend, the frontend 
        // will only see this update if we persist it to a shared database.

        return res.status(200).json({ 
            message: 'Webhook processed successfully',
            received: { transaction_id, status, reference }
        });

    } catch (error: any) {
        console.error('Webhook Error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
