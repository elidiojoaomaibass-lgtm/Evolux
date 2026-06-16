-- ================================================
-- PASSO 3: Cole e execute tudo isso no SQL Editor
-- do seu Supabase (https://supabase.com/dashboard/project/cxcncoexhlfihfvfgvld/sql)
-- ================================================

-- 1. Tabela para guardar o token de notificação de cada dispositivo/usuário
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  user_email text PRIMARY KEY,
  token      text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público push" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 2. Ativar a extensão HTTP para o banco poder chamar a Edge Function
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- 3. Função disparada automaticamente pelo banco para enviar push
CREATE OR REPLACE FUNCTION public.notify_push_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_title text;
  v_body  text;
BEGIN
  -- Notificar ao admin quando uma venda for concluída
  IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT')
     AND NEW.status = 'Concluído'
     AND NEW.type = 'payment'
     AND (OLD.status IS DISTINCT FROM 'Concluído') THEN

    v_title := 'Você recebeu um novo pedido! 🎉';
    v_body  := 'Venda de ' || NEW.amount || ' MT via ' || NEW.method;

    -- Chamar a Edge Function send-push via HTTP
    PERFORM extensions.http_post(
      'https://cxcncoexhlfihfvfgvld.supabase.co/functions/v1/send-push',
      json_build_object(
        'title', v_title,
        'body',  v_body
      )::text,
      'application/json'
    );
  END IF;

  -- Notificar ao admin quando um saque for aprovado
  IF (TG_OP = 'UPDATE')
     AND NEW.status = 'Concluído'
     AND NEW.type = 'withdrawal'
     AND (OLD.status IS DISTINCT FROM 'Concluído') THEN

    v_title := '💸 Saque Aprovado!';
    v_body  := 'Saque de ' || NEW.amount || ' MZN concluído com sucesso.';

    PERFORM extensions.http_post(
      'https://cxcncoexhlfihfvfgvld.supabase.co/functions/v1/send-push',
      json_build_object(
        'title', v_title,
        'body',  v_body
      )::text,
      'application/json'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Criar o gatilho na tabela de transações
DROP TRIGGER IF EXISTS trigger_push_transaction ON public.transactions;
CREATE TRIGGER trigger_push_transaction
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_push_on_transaction();
