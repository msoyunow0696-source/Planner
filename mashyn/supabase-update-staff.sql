-- =====================================================
-- Alpha Drive — сотрудники: Управляющий и Оператор
-- Supabase → SQL Editor → вставить целиком → Run (один раз).
-- То же самое есть в конце supabase-setup.sql.
--
-- Роли в профиле (data.role): admin, moder (Управляющий), operator (Оператор), user.
-- ЗАЩИТА ОТ МОШЕННИКОВ: права управляющего и оператора включаются
-- только для входа, который разрешил админ. Разрешение привязано
-- к сеансу входа (session_id в токене Supabase). Если кто-то узнает
-- пароль сотрудника и войдёт сам, у него будет новый сеанс без
-- разрешения — он увидит приложение как обычный пользователь.
-- После «Выйти» разрешение пропадает, при следующем входе — снова к админу.
-- =====================================================

-- Запросы на вход сотрудников. Политик нет: доступ только через функции ниже
create table if not exists public.mb_staff_access (
    sid uuid primary key,
    uid uuid not null references auth.users(id) on delete cascade,
    device text not null default '' check (length(device) <= 120),
    status text not null default 'pending' check (status in ('pending', 'ok', 'no')),
    created_at timestamptz not null default now(),
    decided_at timestamptz
);
alter table public.mb_staff_access enable row level security;

-- Сеанс входа из токена
create or replace function public.mb_session()
returns uuid language sql stable as $$
    select nullif(auth.jwt()->>'session_id', '')::uuid;
$$;

-- Сотрудник с правами: админ всегда, управляющий и оператор — только на разрешённом входе
create or replace function public.mb_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
    select coalesce(public.mb_role() = 'admin' or (public.mb_role() in ('moder', 'operator') and exists (
        select 1 from public.mb_staff_access where sid = public.mb_session() and uid = auth.uid() and status = 'ok'
    )), false);
$$;

-- Статус текущего входа сотрудника: null (не запрашивал), pending, ok, no
create or replace function public.mb_staff_status()
returns text language sql stable security definer set search_path = public as $$
    select status from public.mb_staff_access where sid = public.mb_session() and uid = auth.uid();
$$;

-- Сотрудник просит админа разрешить этот вход
create or replace function public.mb_staff_request(p_device text)
returns text language plpgsql security definer set search_path = public as $$
declare
    s uuid := public.mb_session();
    st text;
begin
    if public.mb_role() not in ('moder', 'operator') then raise exception 'Только для сотрудников'; end if;
    if s is null then raise exception 'Войдите заново'; end if;
    select status into st from public.mb_staff_access where sid = s;
    if st = 'ok' then return st; end if;
    -- Не больше 5 запросов в час: защита от спама админу
    if (select count(*) from public.mb_staff_access where uid = auth.uid() and created_at > now() - interval '1 hour') >= 5 then
        raise exception 'Слишком много запросов. Подождите час.';
    end if;
    insert into public.mb_staff_access (sid, uid, device) values (s, auth.uid(), left(coalesce(p_device, ''), 120))
    on conflict (sid) do update set status = 'pending', device = excluded.device, created_at = now(), decided_at = null;
    return 'pending';
end;
$$;

-- Новый запрос — уведомление всем админам (придёт и при закрытом приложении)
create or replace function public.mb_staff_access_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    nm text := (select data->>'name' from public.mb_records where coll = 'users' and id = new.uid::text);
    a record;
begin
    if new.status <> 'pending' then return new; end if;
    for a in select id from public.mb_records where coll = 'users' and data->>'role' = 'admin' loop
        insert into public.mb_records (coll, id, data) values ('notifs', 'sa-' || new.sid || '-' || a.id, jsonb_build_object(
            'id', 'sa-' || new.sid || '-' || a.id, 'uid', a.id, 'read', false,
            'time', (extract(epoch from now()) * 1000)::bigint,
            'text', 'Сотрудник ' || coalesce(nm, '?') || ' просит разрешить вход: ' || coalesce(nullif(new.device, ''), 'устройство')
        )) on conflict (coll, id) do update set data = excluded.data;
    end loop;
    return new;
end;
$$;
drop trigger if exists mb_staff_access_notify on public.mb_staff_access;
create trigger mb_staff_access_notify after insert or update of status, created_at on public.mb_staff_access
    for each row execute function public.mb_staff_access_notify();

-- Админ: все запросы и разрешённые входы
create or replace function public.mb_staff_list()
returns table (sid uuid, uid uuid, device text, status text, created_at timestamptz, decided_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
    if not public.mb_is_admin() then raise exception 'Только для админа'; end if;
    return query select a.sid, a.uid, a.device, a.status, a.created_at, a.decided_at from public.mb_staff_access a
        where a.status <> 'no' or a.created_at > now() - interval '7 days'
        order by a.created_at desc limit 200;
end;
$$;

-- Админ разрешает или отклоняет вход
create or replace function public.mb_staff_decide(p_sid uuid, p_ok boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
    if not public.mb_is_admin() then raise exception 'Только для админа'; end if;
    update public.mb_staff_access set status = case when p_ok then 'ok' else 'no' end, decided_at = now() where sid = p_sid;
end;
$$;

-- Админ закрывает все входы сотрудника (например, телефон потерян)
create or replace function public.mb_staff_revoke(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
    if not public.mb_is_admin() then raise exception 'Только для админа'; end if;
    update public.mb_staff_access set status = 'no', decided_at = now() where uid = p_uid and status <> 'no';
end;
$$;

revoke execute on function public.mb_staff_status() from anon;
revoke execute on function public.mb_staff_request(text) from anon;
revoke execute on function public.mb_staff_list() from anon;
revoke execute on function public.mb_staff_decide(uuid, boolean) from anon;
revoke execute on function public.mb_staff_revoke(uuid) from anon;

-- Оператор помогает людям, но блокировать и отмечать «Проверенный» не может
create or replace function public.mb_operator_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.coll = 'users' and pg_trigger_depth() = 1 and public.mb_role() = 'operator'
       and ((new.data->'blocked') is distinct from (old.data->'blocked') or (new.data->'verified') is distinct from (old.data->'verified')) then
        raise exception 'Блокирует только управляющий или админ';
    end if;
    return new;
end;
$$;
drop trigger if exists mb_operator_guard on public.mb_records;
create trigger mb_operator_guard before update on public.mb_records
    for each row execute function public.mb_operator_guard();
