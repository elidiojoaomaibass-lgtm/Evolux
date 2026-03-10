import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey);

// Function to create a dummy supabase client that won't crash the app
const createDummyClient = () => {
    console.warn('Supabase: Usando cliente dummy. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas configurações da Vercel.');
    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ data: { session: null }, error: new Error('Variable VITE_SUPABASE_URL está faltando na Vercel.') }),
            signUp: async () => ({ data: { session: null }, error: new Error('Variable VITE_SUPABASE_URL está faltando na Vercel.') }),
            signOut: async () => ({ error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null }),
                    single: () => Promise.resolve({ data: null, error: null }),
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
                order: () => Promise.resolve({ data: [], error: null }),
            }),
            insert: () => Promise.resolve({ data: null, error: null }),
            update: () => Promise.resolve({ data: null, error: null }),
            upsert: () => Promise.resolve({ data: null, error: null }),
            delete: () => Promise.resolve({ data: null, error: null }),
        }),
    } as any;
};

export const supabase = (() => {
    if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
        return createDummyClient();
    }
    try {
        return createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.error('Erro ao inicializar Supabase:', e);
        return createDummyClient();
    }
})();
