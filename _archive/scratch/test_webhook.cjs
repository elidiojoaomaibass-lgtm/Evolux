const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler o arquivo .env
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateWebhook() {
  const transaction_id = "ORD1779133887532"; // ID da transação Pendente que vimos no banco
  const status = "SUCCESSFUL";
  const reference = "ORD1779133887532";

  console.log(`[Simulação] Atualizando transação ${transaction_id} para status: Concluído`);

  const finalStatus = status === 'SUCCESSFUL' ? 'Concluído' : 'Falhou';

  const { data, error } = await supabase
    .from('transactions')
    .update({ status: finalStatus })
    .eq('id', transaction_id);

  if (error) {
    console.error("Erro ao atualizar por ID:", error);
    // Tentar fallback por referência
    const { error: refError } = await supabase
      .from('transactions')
      .update({ status: finalStatus })
      .eq('reference', reference);
    
    if (refError) {
      console.error("Erro no fallback por referência:", refError);
    } else {
      console.log("Sucesso ao atualizar pelo fallback de referência!");
    }
  } else {
    console.log("Sucesso ao atualizar a transação por ID no Supabase!");
  }
  
  // Verificar o estado atualizado
  const { data: updatedData } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transaction_id);
    
  console.log("Estado atual no Banco de Dados:", updatedData);
}

simulateWebhook();
