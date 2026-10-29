-- =====================================================
-- Maşyn Bazar — общая база в Supabase
-- Supabase → SQL Editor → вставить целиком → Run (один раз)
-- Все данные приложения лежат в одной таблице mb_records:
-- coll — коллекция (users, listings, comments, complaints, payments, subs, notifs, settings)
-- id   — id записи из приложения, data — сама запись (JSON)
-- =====================================================

create table if not exists public.mb_records (
    coll text not null,
    id text not null,
    owner uuid,
    data jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (coll, id)
);

-- Сотрудник: админ или модератор
create or replace function public.mb_role()
returns text language sql stable security definer set search_path = public as $$
    select data->>'role' from public.mb_records where coll = 'users' and id = auth.uid()::text;
$$;

create or replace function public.mb_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
    select coalesce(public.mb_role() in ('admin', 'moder'), false);
$$;

create or replace function public.mb_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
    select coalesce(public.mb_role() = 'admin', false);
$$;

-- ====== ПРОВЕРКИ ПРИ ЗАПИСИ ======
create or replace function public.mb_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    staff boolean := public.mb_is_staff();
    me text := auth.uid()::text;
begin
    new.updated_at := now();
    new.owner := nullif(case when new.coll = 'users' then new.id else new.data->>'uid' end, '')::uuid;
    -- Изменения из других триггеров базы (например, скрытие по жалобам) не проверяем
    if pg_trigger_depth() > 1 then
        if tg_op = 'UPDATE' then new.owner := old.owner; end if;
        return new;
    end if;

    if new.coll = 'users' then
        if tg_op = 'INSERT' then
            -- Первый зарегистрированный становится админом, остальные — обычные пользователи
            if not exists (select 1 from public.mb_records where coll = 'users') then
                new.data := new.data || '{"role":"admin"}';
            elsif not staff then
                new.data := new.data || '{"role":"user","blocked":false,"verified":0}';
            end if;
        elsif not public.mb_is_admin() then
            if (new.data->'role') is distinct from (old.data->'role') then
                raise exception 'Нельзя менять роль';
            end if;
            if not staff and ((new.data->'blocked') is distinct from (old.data->'blocked') or (new.data->'verified') is distinct from (old.data->'verified')) then
                raise exception 'Нельзя менять блокировку и проверку';
            end if;
        end if;
        return new;
    end if;

    -- Заблокированный пользователь не может ничего публиковать
    if tg_op = 'INSERT' and not staff and new.coll in ('listings', 'comments', 'complaints', 'payments') and exists (
        select 1 from public.mb_records where coll = 'users' and id = me and (data->>'blocked')::boolean
    ) then
        raise exception 'Аккаунт заблокирован';
    end if;

    -- Чужое объявление можно только лайкнуть и посмотреть, чужой комментарий — не трогать
    if tg_op = 'UPDATE' and not staff and old.owner is distinct from auth.uid() then
        if new.coll = 'listings' and (new.data - 'likes' - 'dislikes' - 'views') <> (old.data - 'likes' - 'dislikes' - 'views') then
            raise exception 'Можно менять только своё объявление';
        elsif new.coll <> 'listings' then
            raise exception 'Можно менять только свои записи';
        end if;
        new.owner := old.owner;
    end if;
    return new;
end;
$$;

drop trigger if exists mb_guard on public.mb_records;
create trigger mb_guard before insert or update on public.mb_records
    for each row execute function public.mb_guard();

-- 5 жалоб — публикация скрывается до проверки
create or replace function public.mb_complaints_hide()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    target text := new.data->>'target';
begin
    if new.coll <> 'complaints' then return new; end if;
    if (select count(*) from public.mb_records where coll = 'complaints' and data->>'target' = target) >= 5 then
        update public.mb_records set data = data || case when new.data->>'type' = 'listing' then '{"hiddenByComplaints":true}' else '{"hidden":true}' end::jsonb
        where coll = case when new.data->>'type' = 'listing' then 'listings' else 'comments' end and id = target;
    end if;
    return new;
end;
$$;

drop trigger if exists mb_complaints_hide on public.mb_records;
create trigger mb_complaints_hide after insert on public.mb_records
    for each row execute function public.mb_complaints_hide();

-- ====== ПРАВА ДОСТУПА ======
alter table public.mb_records enable row level security;

drop policy if exists "mb: читать" on public.mb_records;
create policy "mb: читать" on public.mb_records for select using (
    coll in ('users', 'listings', 'comments', 'settings') or owner = auth.uid() or public.mb_is_staff()
);

drop policy if exists "mb: добавлять" on public.mb_records;
create policy "mb: добавлять" on public.mb_records for insert to authenticated with check (
    (coll = 'users' and id = auth.uid()::text)
    or (coll in ('listings', 'comments', 'complaints', 'payments') and data->>'uid' = auth.uid()::text)
    or coll = 'notifs'
    or (coll = 'subs' and public.mb_is_staff())
    or (coll = 'settings' and public.mb_is_admin())
);

drop policy if exists "mb: менять" on public.mb_records;
create policy "mb: менять" on public.mb_records for update to authenticated using (
    owner = auth.uid() or public.mb_is_staff() or coll = 'listings'
) with check (coll <> 'settings' or public.mb_is_admin());

drop policy if exists "mb: удалять" on public.mb_records;
create policy "mb: удалять" on public.mb_records for delete to authenticated using (
    owner = auth.uid() or public.mb_is_staff()
);

-- ====== ВХОД ПО ПОЧТЕ И СЛУЖЕБНЫЕ ДЕЙСТВИЯ ======
-- Почта не хранится в открытом профиле: телефон для входа ищем по ней здесь
create or replace function public.mb_phone_for_email(p_email text)
returns text language sql stable security definer set search_path = public as $$
    select raw_user_meta_data->>'phone' from auth.users
    where lower(raw_user_meta_data->>'email') = lower(trim(p_email)) limit 1;
$$;

create or replace function public.mb_email_taken(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from auth.users where lower(raw_user_meta_data->>'email') = lower(trim(p_email)));
$$;

-- Админ задаёт пользователю новый пароль
create or replace function public.mb_reset_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
    if not public.mb_is_admin() then raise exception 'Только для админа'; end if;
    update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')) where id = p_user;
end;
$$;

-- Пользователь удаляет свой аккаунт и все свои записи
create or replace function public.mb_delete_me()
returns void language plpgsql security definer set search_path = public as $$
begin
    delete from public.mb_records where owner = auth.uid();
    delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.mb_reset_password(uuid, text) from anon;
revoke execute on function public.mb_delete_me() from anon;

-- =====================================================
-- УВЕДОМЛЕНИЯ, КОГДА ПРИЛОЖЕНИЕ ЗАКРЫТО
-- Телефон после входа регистрирует свой секретный ключ.
-- Фоновая проверка в Android раз в ~15 минут спрашивает по этому ключу
-- новые непрочитанные уведомления своего пользователя.
-- =====================================================
create table if not exists public.mb_devices (
    key text primary key check (length(key) >= 32),
    uid uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);
-- Политик нет: таблица доступна только через функции ниже
alter table public.mb_devices enable row level security;

create or replace function public.mb_register_device(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'Нужно войти'; end if;
    insert into public.mb_devices (key, uid) values (p_key, auth.uid())
    on conflict (key) do update set uid = excluded.uid, created_at = now();
end;
$$;

create or replace function public.mb_unregister_device(p_key text)
returns void language sql security definer set search_path = public as $$
    delete from public.mb_devices where key = p_key;
$$;

create or replace function public.mb_device_notifs(p_key text, p_since bigint)
returns table (n_id text, n_text text, n_time bigint) language sql stable security definer set search_path = public as $$
    select r.id, r.data->>'text', (r.data->>'time')::bigint
    from public.mb_records r join public.mb_devices d on d.uid = r.owner
    where d.key = p_key and r.coll = 'notifs'
      and not coalesce((r.data->>'read')::boolean, false)
      and (r.data->>'time')::bigint > p_since
    order by 3 limit 20;
$$;

revoke execute on function public.mb_register_device(text) from anon;

-- Старый сайт «Автомаркет» ставил свой триггер на auth.users и ломал регистрацию в приложении
drop trigger if exists on_auth_user_created on auth.users;
