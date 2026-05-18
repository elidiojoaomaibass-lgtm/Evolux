import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cxcncoexhlfihfvfgvld.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Y25jb2V4aGxmaWhmdmZndmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDcyODksImV4cCI6MjA4OTYyMzI4OX0.2jdcswTURFSNFXAN3ajWDUdANcja1qgrYcqAjm9Ge3M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Tentando inserir transação como utilizador anónimo...");
  const { data, error } = await supabase.from('transactions').insert([{
    id: `TEST_ANON_${Date.now()}`,
    type: 'payment',
    amount: 1,
    phone: '840000000',
    method: 'M-Pesa',
    status: 'Falhou',
    reference: `REF${Date.now()}`,
    description: 'Teste de insercao anonima',
    customerName: 'Cliente Teste',
    customerEmail: 'teste@teste.com',
    device: 'Mobile'
  }]);

  if (error) {
    console.error("ERRO AO INSERIR:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCESSO AO INSERIR:", data);
  }
}

testInsert();
