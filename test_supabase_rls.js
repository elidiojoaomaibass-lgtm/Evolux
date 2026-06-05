const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'Concluído' })
        .eq('id', 'non-existent-id')
        .select();
        
    console.log('Update result:', { data, error });
}

testUpdate();
