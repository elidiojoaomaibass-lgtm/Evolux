/* Corrigindo a sintaxe das políticas de RLS para o bucket de imagens */

-- Permitir upload para usuários autenticados (usar WITH CHECK)
create policy "allow upload"
    on storage.objects
    for insert
    with check (auth.role() = 'authenticated');

-- Permitir leitura pública
create policy "public read"
    on storage.objects
    for select
    using (true);
