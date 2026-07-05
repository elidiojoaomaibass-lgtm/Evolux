-- Garante que as colunas existem (caso ainda não tenham sido criadas)
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT;

-- Garante que o utilizador autenticado pode upsert na sua própria linha
-- (necessário se RLS estiver ativado na tabela)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_settings' AND policyname = 'Users can upsert own settings'
    ) THEN
        CREATE POLICY "Users can upsert own settings"
        ON user_settings
        FOR ALL
        TO authenticated
        USING (user_email = auth.email())
        WITH CHECK (user_email = auth.email());
    END IF;
END $$;

-- Ativa RLS se ainda não estiver ativo
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
