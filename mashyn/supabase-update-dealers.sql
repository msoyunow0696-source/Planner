-- =====================================================
-- Alpha Drive — обновление базы: «Автосалоны»
-- Supabase → SQL Editor → вставить целиком → Run (один раз).
-- Что добавляет:
--   dealers — страница автосалона: uid (владелец), name, reg, place, desc, services[], phone, logo, banner, hidden, created
--   listings.data.dealer — объявление привязано к салону (только к своему)
-- Правила: страницу видят все; создать — любой вошедший (одну); менять и удалять — владелец салона и администрация;
-- скрыть салон — только администрация (или само, при 5 жалобах).
-- Политики пересоздаются целиком и включают правила «Денег» (expenses), так что порядок запуска с
-- supabase-update-money.sql не важен. То же самое есть в конце supabase-setup.sql.
-- =====================================================

drop policy if exists "mb: читать" on public.mb_records;
create policy "mb: читать" on public.mb_records for select using (
    (coll <> 'expenses' and (
        coll in ('users', 'listings', 'comments', 'settings', 'reviews', 'dealers') or owner = auth.uid() or public.mb_is_staff()
        or (coll = 'msgs' and data->>'to' = auth.uid()::text)
    ))
    or (coll = 'expenses' and public.mb_is_admin())
);

drop policy if exists "mb: добавлять" on public.mb_records;
create policy "mb: добавлять" on public.mb_records for insert to authenticated with check (
    (coll = 'users' and id = auth.uid()::text)
    or (coll in ('listings', 'comments', 'complaints', 'payments', 'alerts', 'support', 'msgs', 'reviews', 'dealers') and data->>'uid' = auth.uid()::text)
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

-- Проверки салона и привязки объявлений к салону
create or replace function public.mb_dealer_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    staff boolean := public.mb_is_staff();
    pfx text := 'https://qjllrvbkwglgcnxteenx.supabase.co/storage/v1/object/public/media/';
    k text;
begin
    -- Изменения из других триггеров (скрытие по жалобам) не проверяем
    if pg_trigger_depth() > 1 then return new; end if;

    -- Объявление можно привязать только к своему салону
    if new.coll = 'listings' and coalesce(new.data->>'dealer', '') <> '' and not staff
       and (tg_op = 'INSERT' or (new.data->>'dealer') is distinct from (old.data->>'dealer'))
       and not exists (select 1 from public.mb_records where coll = 'dealers' and id = new.data->>'dealer' and owner = auth.uid()) then
        raise exception 'Можно указать только свой автосалон';
    end if;

    if new.coll <> 'dealers' or staff then return new; end if;
    if length(coalesce(new.data->>'name', '')) not between 2 and 60 then raise exception 'Название салона: от 2 до 60 символов'; end if;
    if length(coalesce(new.data->>'desc', '')) > 2000 then raise exception 'Описание слишком длинное'; end if;
    foreach k in array array['logo', 'banner'] loop
        if coalesce(new.data->>k, '') <> '' and left(new.data->>k, length(pfx)) <> pfx then
            raise exception 'Картинки можно загружать только через приложение';
        end if;
    end loop;
    if tg_op = 'INSERT' then
        if exists (select 1 from public.mb_records where coll = 'dealers' and owner = auth.uid()) then
            raise exception 'У вас уже есть страница салона';
        end if;
        new.data := new.data || '{"hidden":false}';
    elsif (new.data->'hidden') is distinct from (old.data->'hidden') then
        raise exception 'Скрыть или показать салон может только администрация';
    end if;
    return new;
end;
$$;
drop trigger if exists mb_dealer_guard on public.mb_records;
create trigger mb_dealer_guard before insert or update on public.mb_records
    for each row execute function public.mb_dealer_guard();

-- При 5 жалобах скрывается и салон (раньше — только объявление или комментарий)
create or replace function public.mb_complaints_hide()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    target text := new.data->>'target';
    kind text := new.data->>'type';
begin
    if new.coll <> 'complaints' then return new; end if;
    if (select count(*) from public.mb_records where coll = 'complaints' and data->>'target' = target) >= 5 then
        update public.mb_records set data = data || case when kind = 'listing' then '{"hiddenByComplaints":true}' else '{"hidden":true}' end::jsonb
        where coll = case kind when 'listing' then 'listings' when 'dealer' then 'dealers' else 'comments' end and id = target;
    end if;
    return new;
end;
$$;
