import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cxcncoexhlfihfvfgvld.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Y25jb2V4aGxmaWhmdmZndmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDcyODksImV4cCI6MjA4OTYyMzI4OX0.2jdcswTURFSNFXAN3ajWDUdANcja1qgrYcqAjm9Ge3M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRecent() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('createdat', { ascending: false })
        .limit(10);
        
    console.log('Recent transactions error:', error);
    console.log('Recent transactions:');
    data?.forEach(tx => {
        console.log(`[${tx.created_at}] ${tx.id} | ${tx.status} | ${tx.method} | ${tx.description}`);
    });
}

checkRecent();
