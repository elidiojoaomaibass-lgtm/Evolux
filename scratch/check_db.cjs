const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão no ficheiro .env.");
  process.exit(1);
}

console.log("Conectando ao Supabase:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' });

    if (error) {
      console.error("Erro ao ler da tabela 'transactions':", error);
    } else {
      console.log("SUCESSO!");
      console.log("Número total de transações na base de dados:", count || (data ? data.length : 0));
      console.log("Últimas 5 transações:", JSON.stringify(data ? data.slice(0, 5) : [], null, 2));
    }
  } catch (err) {
    console.error("Erro fatal ao fazer consulta:", err.message);
  }
}

check();
