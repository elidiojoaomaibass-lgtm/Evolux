
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gignixlgksnoaztqnbpk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ25peGxna3Nub2F6dHFuYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzY3ODcsImV4cCI6MjA4NzUxMjc4N30.EIn8X5clx-GLfuP5Dfi45oFDsC-b82vfIkCppVgZpJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
    console.log('Tentando criar usuário: kingleakds@gmail.com...');
    const { data, error } = await supabase.auth.signUp({
        email: 'kingleakds@gmail.com',
        password: 'Albertina198211',
        options: {
            data: {
                full_name: 'Senhor Incrível',
            }
        }
    });

    if (error) {
        console.error('Erro ao criar usuário:', error.message);
    } else {
        console.log('Usuário criado com sucesso!', data.user?.email);
        if (!data.session) {
            console.log('Nota: Verifique se a confirmação de e-mail está ativa no site ou se o limite foi atingido.');
        }
    }
}

createUser();
