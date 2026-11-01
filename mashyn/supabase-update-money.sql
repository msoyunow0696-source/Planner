-- =====================================================
-- Alpha Drive — обновление базы: «Деньги» (расходы в админке)
-- Supabase → SQL Editor → вставить целиком → Run (один раз).
-- Что добавляет: коллекцию expenses — расходы, которые админ вносит вручную.
-- Читать, добавлять, менять и удалять расходы может только админ (не модератор и не оператор).
-- Остальные права не меняются: политики пересоздаются целиком с теми же правилами.
-- То же самое уже есть в конце supabase-setup.sql — этот файл, чтобы не запускать всю схему заново.
-- =====================================================

-- expenses — расход: uid (кто внёс), day 'ГГГГ-ММ-ДД', amount (TMT), cat (ads, server, salary, other), note, time
drop policy if exists "mb: читать" on public.mb_records;
create policy "mb: читать" on public.mb_records for select using (
    (coll <> 'expenses' and (
        coll in ('users', 'listings', 'comments', 'settings', 'reviews') or owner = auth.uid() or public.mb_is_staff()
        or (coll = 'msgs' and data->>'to' = auth.uid()::text)
    ))
    or (coll = 'expenses' and public.mb_is_admin())
);

drop policy if exists "mb: добавлять" on public.mb_records;
create policy "mb: добавлять" on public.mb_records for insert to authenticated with check (
    (coll = 'users' and id = auth.uid()::text)
    or (coll in ('listings', 'comments', 'complaints', 'payments', 'alerts', 'support', 'msgs', 'reviews') and data->>'uid' = auth.uid()::text)
    or (coll = 'notifs' and (data->>'uid' = auth.uid()::text or public.mb_is_staff()))
    or (coll = 'subs' and public.mb_is_staff())
    or (coll in ('settings', 'expenses') and public.mb_is_admin())
);

drop policy if exists "mb: менять" on public.mb_records;
create policy "mb: менять" on public.mb_records for update to authenticated using (
    (coll <> 'expenses' and (owner = auth.uid() or public.mb_is_staff() or coll = 'listings'))
    or (coll = 'expenses' and public.mb_is_admin())
) with check (coll not in ('settings', 'expenses') or public.mb_is_admin());

drop policy if exists "mb: удалять" on public.mb_records;
create policy "mb: удалять" on public.mb_records for delete to authenticated using (
    (coll <> 'expenses' and (owner = auth.uid() or public.mb_is_staff()))
    or (coll = 'expenses' and public.mb_is_admin())
);
