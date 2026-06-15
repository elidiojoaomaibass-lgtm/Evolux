import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Load environment variables (VITE_ prefix for frontend, plain for backend)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get ISO timestamp 30 seconds ago
function thirtySecondsAgo(): string {
  return new Date(Date.now() - 30 * 1000).toISOString();
}

async function approvePending() {
  try {
    const { data: pending, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('status', 'Pendente');
    
    if (error) {
      console.error('Error fetching pending transactions:', error);
      return;
    }

      return;
    }

    console.log(`Approving ${pendingTx.length} pending transaction(s)...`);
    for (const tx of pendingTx) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'Concluído' })
        .eq('id', tx.id);
      if (updateError) {
        console.error(`Failed to approve transaction ${tx.id}:`, updateError);
      } else {
        console.log(`Transaction ${tx.id} approved.`);
      }
    }
  } catch (err) {
    console.error('Unexpected error in approvePending:', err);
  }
}

// Run once when the script starts
approvePending();

// Optionally, keep running every 30 seconds if desired
// setInterval(approvePending, 30 * 1000);
