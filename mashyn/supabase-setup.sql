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

-- =====================================================
-- «СООБЩИТЬ, КОГДА ПОЯВИТСЯ»: сохранённые поиски (coll = 'alerts')
-- Когда публикуется новое объявление, база сама находит подходящие
-- поиски других людей и добавляет им уведомление.
-- =====================================================
drop policy if exists "mb: добавлять" on public.mb_records;
create policy "mb: добавлять" on public.mb_records for insert to authenticated with check (
    (coll = 'users' and id = auth.uid()::text)
    or (coll in ('listings', 'comments', 'complaints', 'payments', 'alerts') and data->>'uid' = auth.uid()::text)
    or coll = 'notifs'
    or (coll = 'subs' and public.mb_is_staff())
    or (coll = 'settings' and public.mb_is_admin())
);

-- Подходит ли объявление под сохранённый поиск
create or replace function public.mb_alert_matches(a jsonb, l jsonb)
returns boolean language plpgsql immutable as $$
declare
    f jsonb := coalesce(a->'f', '{}');
    sp jsonb := coalesce(l->'specs', '{}');
    k text;
    v jsonb;
begin
    if coalesce(a->>'sec', 'all') not in ('all', l->>'sec') then return false; end if;
    if coalesce(a->>'q', '') <> '' and position(lower(a->>'q') in lower(concat_ws(' ', l->>'title', l->>'reg', l->>'place', sp::text))) = 0 then return false; end if;
    if f ? 'reg' and f->>'reg' <> coalesce(l->>'reg', '') then return false; end if;
    if f ? 'place' and f->>'place' <> coalesce(l->>'place', '') then return false; end if;
    if f ? 'pmin' and coalesce((l->>'price')::numeric, 0) < (f->>'pmin')::numeric then return false; end if;
    if f ? 'pmax' and (coalesce((l->>'price')::numeric, 0) = 0 or (l->>'price')::numeric > (f->>'pmax')::numeric) then return false; end if;
    if f ? 'ymin' and coalesce((sp->>'year')::numeric, 0) < (f->>'ymin')::numeric then return false; end if;
    if f ? 'ymax' and coalesce((sp->>'year')::numeric, 9999) > (f->>'ymax')::numeric then return false; end if;
    if jsonb_typeof(f->'brand') = 'array' and jsonb_array_length(f->'brand') > 0
       and not (f->'brand') ? coalesce(sp->>'brand', sp->>'tbrand', sp->>'pbrand', '') then return false; end if;
    -- Остальные фильтры-списки: топливо, кузов, кредит, обмен и т.д.
    for k, v in select * from jsonb_each(f) loop
        if k <> 'brand' and jsonb_typeof(v) = 'array' and jsonb_array_length(v) > 0 then
            if not exists (select 1 from jsonb_array_elements_text(v) e
                           where e = any(string_to_array(coalesce(sp->>k, ''), ', '))) then
                return false;
            end if;
        end if;
    end loop;
    return true;
end;
$$;

create or replace function public.mb_alerts_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    a record;
    ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
    if new.coll <> 'listings' or coalesce(new.data->>'status', '') <> 'active' then return new; end if;
    for a in select * from public.mb_records
             where coll = 'alerts' and owner is distinct from new.owner and public.mb_alert_matches(data, new.data) loop
        insert into public.mb_records (coll, id, data) values ('notifs', gen_random_uuid()::text, jsonb_build_object(
            'id', gen_random_uuid()::text, 'uid', a.owner, 'time', ms, 'read', false,
            'text', 'Новое объявление по вашему поиску: «' || (new.data->>'title') || '»'
                    || case when coalesce((new.data->>'price')::numeric, 0) > 0 then ' — ' || (new.data->>'price') || ' TMT' else '' end));
    end loop;
    return new;
end;
$$;

drop trigger if exists mb_alerts_notify on public.mb_records;
create trigger mb_alerts_notify after insert on public.mb_records
    for each row execute function public.mb_alerts_notify();

-- =====================================================
-- СЛУЖБА ПОДДЕРЖКИ: обращения пользователей (coll = 'support')
-- Видят автор и сотрудники, отвечают сотрудники.
-- =====================================================
drop policy if exists "mb: добавлять" on public.mb_records;
create policy "mb: добавлять" on public.mb_records for insert to authenticated with check (
    (coll = 'users' and id = auth.uid()::text)
    or (coll in ('listings', 'comments', 'complaints', 'payments', 'alerts', 'support') and data->>'uid' = auth.uid()::text)
    or coll = 'notifs'
    or (coll = 'subs' and public.mb_is_staff())
    or (coll = 'settings' and public.mb_is_admin())
);

-- =====================================================
-- ЗАЩИТА ОТ МОШЕННИКОВ И ВЗЛОМА
-- Приложение можно обойти и слать запросы к базе напрямую,
-- поэтому все важные правила проверяет сама база.
-- =====================================================
alter table public.mb_records add column if not exists created_at timestamptz not null default now();
create index if not exists mb_records_owner_coll on public.mb_records (owner, coll, created_at);

-- Сколько записей человек создал за последнее время (защита от спама)
create or replace function public.mb_recent(p_coll text, p_owner uuid, p_since interval)
returns int language sql stable security definer set search_path = public as $$
    select count(*)::int from public.mb_records where coll = p_coll and owner = p_owner and created_at > now() - p_since;
$$;

create or replace function public.mb_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    staff boolean := public.mb_is_staff();
    me text := auth.uid()::text;
    now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
    max_until bigint := now_ms + 31::bigint * 86400000;
    free_mode boolean := coalesce((select data->>'mode' from public.mb_records where coll = 'settings' and id = 'main'), 'free') = 'free';
    storage_prefix text := 'https://qjllrvbkwglgcnxteenx.supabase.co/storage/v1/object/public/media/';
    video_prefix text := 'https://qjllrvbkwglgcnxteenx.supabase.co/storage/v1/object/public/video/';
    k text;
    v jsonb;
    txt text;
begin
    new.updated_at := now();
    new.owner := nullif(case when new.coll = 'users' then new.id else new.data->>'uid' end, '')::uuid;
    if tg_op = 'UPDATE' then new.created_at := old.created_at; end if;
    -- Изменения из других триггеров базы (скрытие по жалобам, уведомления) не проверяем
    if pg_trigger_depth() > 1 then
        if tg_op = 'UPDATE' then new.owner := old.owner; end if;
        return new;
    end if;

    -- ====== Профили ======
    if new.coll = 'users' then
        if not staff then
            if length(coalesce(new.data->>'name', '')) not between 2 and 60 then raise exception 'Имя: от 2 до 60 символов'; end if;
            -- Нельзя выдавать себя за администрацию
            if lower(new.data->>'name') ~ '(admin|админ|модератор|moderator|поддержк|support|alpha ?drive|administrator|администрац)' then
                raise exception 'Это имя занято. Выберите другое.';
            end if;
        end if;
        if tg_op = 'INSERT' then
            -- Телефон в профиле — тот же, что при регистрации
            if new.data->>'phone' is distinct from (select raw_user_meta_data->>'phone' from auth.users where id = auth.uid()) then
                raise exception 'Номер телефона не совпадает с регистрацией';
            end if;
            if not exists (select 1 from public.mb_records where coll = 'users') then
                new.data := new.data || '{"role":"admin"}';
            elsif not staff then
                new.data := new.data || '{"role":"user","blocked":false,"verified":0,"freeUsed":false}';
            end if;
        elsif not public.mb_is_admin() then
            if (new.data->'role') is distinct from (old.data->'role') then raise exception 'Нельзя менять роль'; end if;
            if not staff then
                if (new.data->'blocked') is distinct from (old.data->'blocked') or (new.data->'verified') is distinct from (old.data->'verified') then
                    raise exception 'Нельзя менять блокировку и проверку';
                end if;
                if (new.data->'phone') is distinct from (old.data->'phone') then raise exception 'Номер телефона менять нельзя'; end if;
                -- Бесплатное объявление дают один раз
                if coalesce((old.data->>'freeUsed')::boolean, false) and not coalesce((new.data->>'freeUsed')::boolean, false) then
                    new.data := new.data || '{"freeUsed":true}';
                end if;
            end if;
        end if;
        return new;
    end if;

    if staff then return new; end if;

    -- Заблокированный пользователь не может ничего публиковать
    if tg_op = 'INSERT' and exists (select 1 from public.mb_records where coll = 'users' and id = me and coalesce((data->>'blocked')::boolean, false)) then
        raise exception 'Аккаунт заблокирован';
    end if;

    -- ====== Чужие записи ======
    if tg_op = 'UPDATE' and old.owner is distinct from auth.uid() then
        if new.coll <> 'listings' then raise exception 'Можно менять только свои записи'; end if;
        -- В чужом объявлении можно только поставить или убрать свой лайк и добавить просмотр
        if (new.data - 'likes' - 'dislikes' - 'views') <> (old.data - 'likes' - 'dislikes' - 'views')
           or coalesce(new.data->'likes', '[]') - me <> coalesce(old.data->'likes', '[]') - me
           or coalesce(new.data->'dislikes', '[]') - me <> coalesce(old.data->'dislikes', '[]') - me
           or coalesce((new.data->>'views')::int, 0) not between coalesce((old.data->>'views')::int, 0) and coalesce((old.data->>'views')::int, 0) + 5 then
            raise exception 'Можно менять только своё объявление';
        end if;
        new.owner := old.owner;
        return new;
    end if;

    -- ====== Ограничения по количеству (антиспам) ======
    if tg_op = 'INSERT' then
        if new.coll = 'listings' and public.mb_recent('listings', auth.uid(), '1 day') >= 10 then raise exception 'Не больше 10 объявлений в сутки'; end if;
        if new.coll = 'comments' and public.mb_recent('comments', auth.uid(), '1 hour') >= 20 then raise exception 'Слишком много комментариев. Подождите час.'; end if;
        if new.coll = 'complaints' and public.mb_recent('complaints', auth.uid(), '1 day') >= 20 then raise exception 'Слишком много жалоб за сутки'; end if;
        if new.coll = 'support' and public.mb_recent('support', auth.uid(), '1 hour') >= 5 then raise exception 'Слишком много обращений. Подождите час.'; end if;
        if new.coll = 'payments' and public.mb_recent('payments', auth.uid(), '1 day') >= 10 then raise exception 'Слишком много заявок на оплату'; end if;
        if new.coll = 'alerts' and public.mb_recent('alerts', auth.uid(), '100 years') >= 20 then raise exception 'Не больше 20 сохранённых поисков'; end if;
        if new.coll = 'notifs' and new.data->>'uid' is distinct from me then raise exception 'Нельзя отправлять уведомления другим'; end if;
    end if;

    -- ====== Объявления ======
    if new.coll = 'listings' then
        if length(coalesce(new.data->>'title', '')) not between 5 and 120 then raise exception 'Заголовок: от 5 до 120 символов'; end if;
        if length(coalesce(new.data->>'desc', '')) > 2000 then raise exception 'Описание слишком длинное'; end if;
        if coalesce((new.data->>'price')::numeric, 0) not between 0 and 100000000 then raise exception 'Проверьте цену'; end if;
        -- Фото — не больше 5 и только из нашего хранилища
        if jsonb_array_length(coalesce(new.data->'photos', '[]')) > 10 then raise exception 'Не больше 10 фото'; end if;
        for v in select * from jsonb_array_elements(coalesce(new.data->'photos', '[]')) loop
            if left(v #>> '{}', length(storage_prefix)) <> storage_prefix then raise exception 'Фото можно загружать только через приложение'; end if;
        end loop;
        -- Видео — одно и только из нашего хранилища видео
        if coalesce(new.data->>'video', '') <> '' and left(new.data->>'video', length(video_prefix)) <> video_prefix then
            raise exception 'Видео можно загружать только через приложение';
        end if;
        if coalesce((new.data->>'until')::bigint, 0) > max_until then raise exception 'Срок объявления не больше 30 дней'; end if;

        if tg_op = 'INSERT' then
            -- Платное продвижение, просмотры и лайки нельзя «нарисовать» себе
            new.data := (new.data - 'vip' - 'top' - 'color' - 'hiddenByComplaints' - 'subId') || '{"views":0,"likes":[],"dislikes":[]}'::jsonb;
            if new.data->>'status' not in ('active', 'review', 'nosub') then raise exception 'Неверный статус объявления'; end if;
            if new.data->>'status' = 'active' and not free_mode then
                new.data := new.data || '{"status":"nosub"}';
            end if;
        else
            for k in select unnest(array['vip','top','color','subId','created','flags','prev','hiddenByComplaints','free','uid','sec']) loop
                if (new.data->k) is distinct from (old.data->k) then raise exception 'Это поле может менять только администратор'; end if;
            end loop;
            if (new.data->'views') is distinct from (old.data->'views') and coalesce((new.data->>'views')::int, 0) > coalesce((old.data->>'views')::int, 0) + 5 then
                raise exception 'Можно менять только своё объявление';
            end if;
            -- Статус: на проверке и отклонённое меняет только модератор; продлить можно только бесплатно в период запуска
            if (new.data->>'status') is distinct from (old.data->>'status') then
                if not (
                    (old.data->>'status' = 'active' and new.data->>'status' = 'expired')
                    or (old.data->>'status' in ('expired', 'nosub') and new.data->>'status' = 'active' and free_mode)
                    -- Продавец сам отмечает «Продано»
                    or (old.data->>'status' in ('active', 'expired') and new.data->>'status' = 'sold')
                ) then
                    raise exception 'Статус объявления меняет модератор';
                end if;
            end if;
        end if;

        -- Бот-модератор на сервере: ссылки и предоплата — на проверку
        txt := lower(coalesce(new.data->>'title', '') || ' ' || coalesce(new.data->>'desc', ''));
        if (tg_op = 'INSERT' or txt <> lower(coalesce(old.data->>'title', '') || ' ' || coalesce(old.data->>'desc', '')))
           and new.data->>'status' = 'active'
           and txt ~ '(https?://|www\.|t\.me|wa\.me|\.com\M|\.ru\M|предоплат|переведите|переводом на карт|номер карты|залог вперёд|öňünden töleg)' then
            new.data := new.data || jsonb_build_object('prev', 'active', 'status', 'review', 'flags', '["Ссылка или предоплата в тексте"]'::jsonb);
        end if;
    end if;

    -- ====== Остальные записи ======
    if new.coll = 'comments' and length(coalesce(new.data->>'text', '')) not between 2 and 500 then raise exception 'Комментарий: от 2 до 500 символов'; end if;
    if new.coll = 'comments' and tg_op = 'INSERT' and not exists (select 1 from public.mb_records where coll = 'listings' and id = new.data->>'lid') then
        raise exception 'Объявление не найдено';
    end if;
    if new.coll = 'support' and (length(coalesce(new.data->>'text', '')) not between 5 and 1000
        or (tg_op = 'INSERT' and (coalesce(new.data->>'reply', '') <> '' or new.data->>'status' <> 'open'))) then
        raise exception 'Неверное обращение';
    end if;
    if new.coll = 'support' and tg_op = 'UPDATE' then raise exception 'Обращение меняет только поддержка'; end if;
    if new.coll = 'complaints' and tg_op = 'INSERT' and exists (
        select 1 from public.mb_records where coll = 'complaints' and owner = auth.uid() and data->>'target' = new.data->>'target') then
        raise exception 'Вы уже отправили жалобу';
    end if;
    if new.coll = 'complaints' and tg_op = 'UPDATE' then raise exception 'Жалобу изменить нельзя'; end if;
    if new.coll = 'payments' then
        if tg_op = 'INSERT' and new.data->>'status' not in ('new', 'pending') then raise exception 'Неверная заявка на оплату'; end if;
        if tg_op = 'UPDATE' then raise exception 'Оплату подтверждает только администратор'; end if;
    end if;
    -- Подписку пользователь может только завершить, но не продлить
    if new.coll = 'subs' and tg_op = 'UPDATE' and ((new.data - 'status') <> (old.data - 'status') or new.data->>'status' <> 'ended') then
        raise exception 'Подписку меняет только администратор';
    end if;
    -- В своём уведомлении можно только отметить «прочитано»
    if new.coll = 'notifs' and tg_op = 'UPDATE' and (new.data - 'read') <> (old.data - 'read') then
        raise exception 'Уведомление изменить нельзя';
    end if;
    return new;
end;
$$;

-- Уведомления другим людям отправляет только база или сотрудники
drop policy if exists "mb: добавлять" on public.mb_records;
create policy "mb: добавлять" on public.mb_records for insert to authenticated with check (
    (coll = 'users' and id = auth.uid()::text)
    or (coll in ('listings', 'comments', 'complaints', 'payments', 'alerts', 'support') and data->>'uid' = auth.uid()::text)
    or (coll = 'notifs' and (data->>'uid' = auth.uid()::text or public.mb_is_staff()))
    or (coll = 'subs' and public.mb_is_staff())
    or (coll = 'settings' and public.mb_is_admin())
);

-- Новый комментарий — уведомление автору объявления (раньше это делал телефон)
create or replace function public.mb_comment_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    l record;
begin
    if new.coll <> 'comments' then return new; end if;
    select * into l from public.mb_records where coll = 'listings' and id = new.data->>'lid';
    if l.owner is not null and l.owner is distinct from new.owner then
        insert into public.mb_records (coll, id, data) values ('notifs', gen_random_uuid()::text, jsonb_build_object(
            'id', gen_random_uuid()::text, 'uid', l.owner, 'read', false,
            'time', (extract(epoch from now()) * 1000)::bigint,
            'text', 'Новый комментарий к «' || (l.data->>'title') || '»'));
    end if;
    return new;
end;
$$;

drop trigger if exists mb_comment_notify on public.mb_records;
create trigger mb_comment_notify after insert on public.mb_records
    for each row execute function public.mb_comment_notify();

-- Хранилище: только картинки до 2 МБ (приложение сжимает фото до 1 МБ)
update storage.buckets set file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'] where id = 'media';

-- =====================================================
-- ВИДЕО В ОБЪЯВЛЕНИЯХ: отдельное хранилище, только видео до 25 МБ
-- =====================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video', 'video', true, 26214400, array['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'])
on conflict (id) do update set public = true, file_size_limit = 26214400, allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];

drop policy if exists "video: загружать в свою папку" on storage.objects;
create policy "video: загружать в свою папку" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text
        and public.mb_recent('listings', auth.uid(), '1 day') < 20);

drop policy if exists "video: удалять своё" on storage.objects;
create policy "video: удалять своё" on storage.objects
    for delete to authenticated
    using (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- ВХОД ПО ПОЧТЕ: основная (email) и дополнительная (email2) почта
-- =====================================================
create or replace function public.mb_phone_for_email(p_email text)
returns text language sql stable security definer set search_path = public as $$
    select raw_user_meta_data->>'phone' from auth.users
    where lower(trim(p_email)) in (lower(raw_user_meta_data->>'email'), lower(raw_user_meta_data->>'email2')) limit 1;
$$;

create or replace function public.mb_email_taken(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from auth.users where lower(trim(p_email)) in (lower(raw_user_meta_data->>'email'), lower(raw_user_meta_data->>'email2')));
$$;

-- =====================================================
-- ПОДТВЕРЖДЕНИЕ ПОЧТЫ И «ЗАБЫЛИ ПАРОЛЬ»
-- Письма отправляет функция mail (supabase/functions/mail) через Gmail.
-- Почта и отметка «подтверждена» хранятся в auth.users.raw_user_meta_data:
-- email, email_verified (+ email2 у админа).
-- =====================================================
create table if not exists public.mb_email_tokens (
    token text primary key,
    uid uuid not null references auth.users(id) on delete cascade,
    email text not null,
    kind text not null check (kind in ('verify', 'reset')),
    expires_at timestamptz not null,
    used boolean not null default false,
    created_at timestamptz not null default now()
);
-- Политик нет: таблицу читает и пишет только функция mail (service role)
alter table public.mb_email_tokens enable row level security;

-- Входить по почте можно только по подтверждённой
create or replace function public.mb_phone_for_email(p_email text)
returns text language sql stable security definer set search_path = public as $$
    select raw_user_meta_data->>'phone' from auth.users
    where (lower(trim(p_email)) = lower(raw_user_meta_data->>'email') and raw_user_meta_data->>'email_verified' = 'true')
       or lower(trim(p_email)) = lower(raw_user_meta_data->>'email2')
    limit 1;
$$;

-- Почта занята, если её уже подтвердил кто-то другой
create or replace function public.mb_email_taken(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from auth.users
        where (lower(trim(p_email)) = lower(raw_user_meta_data->>'email') and raw_user_meta_data->>'email_verified' = 'true')
           or lower(trim(p_email)) = lower(raw_user_meta_data->>'email2'));
$$;

-- Почты админа Mekan — его собственные, считаем подтверждёнными
update auth.users set raw_user_meta_data = raw_user_meta_data || '{"email_verified":"true"}'
where id = (select owner from public.mb_records where coll = 'users' and data->>'role' = 'admin' limit 1)
  and raw_user_meta_data->>'email' = 'msoyunow0696@gmail.com';

-- ====== Скрытые теги для поиска (data.tags) — не больше 200 символов ======
create or replace function public.mb_tags_guard() returns trigger language plpgsql as $$
begin
    if new.coll = 'listings' and new.data ? 'tags' then
        if jsonb_typeof(new.data->'tags') <> 'string' or length(new.data->>'tags') > 200 then
            raise exception 'Теги: не больше 200 символов';
        end if;
    end if;
    return new;
end $$;
drop trigger if exists mb_tags_guard on public.mb_records;
create trigger mb_tags_guard before insert or update on public.mb_records
    for each row execute function public.mb_tags_guard();

-- =====================================================
-- ЧАТ И ОТЗЫВЫ
-- msgs    — сообщения покупатель ↔ продавец: uid (кто), to (кому), lid (объявление), text, time
-- reviews — отзывы о продавце: uid (автор), to (продавец), stars 1–5, text, time
-- Сообщение видят только двое. Отзыв видят все, оставить можно один раз
-- и только тому, с кем переписывались или чьё объявление комментировали.
-- =====================================================
drop policy if exists "mb: читать" on public.mb_records;
create policy "mb: читать" on public.mb_records for select using (
    coll in ('users', 'listings', 'comments', 'settings', 'reviews') or owner = auth.uid() or public.mb_is_staff()
    or (coll = 'msgs' and data->>'to' = auth.uid()::text)
);

drop policy if exists "mb: добавлять" on public.mb_records;
create policy "mb: добавлять" on public.mb_records for insert to authenticated with check (
    (coll = 'users' and id = auth.uid()::text)
    or (coll in ('listings', 'comments', 'complaints', 'payments', 'alerts', 'support', 'msgs', 'reviews') and data->>'uid' = auth.uid()::text)
    or (coll = 'notifs' and (data->>'uid' = auth.uid()::text or public.mb_is_staff()))
    or (coll = 'subs' and public.mb_is_staff())
    or (coll = 'settings' and public.mb_is_admin())
);

create or replace function public.mb_chat_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare
    me uuid := auth.uid();
    other text := new.data->>'to';
begin
    if new.coll not in ('msgs', 'reviews') or pg_trigger_depth() > 1 then return new; end if;
    if tg_op = 'UPDATE' and not public.mb_is_staff() then raise exception 'Сообщение и отзыв изменить нельзя'; end if;
    if tg_op <> 'INSERT' then return new; end if;
    if other is null or other = me::text or not exists (select 1 from public.mb_records where coll = 'users' and id = other) then
        raise exception 'Получатель не найден';
    end if;
    if exists (select 1 from public.mb_records where coll = 'users' and id = me::text and coalesce((data->>'blocked')::boolean, false)) then
        raise exception 'Аккаунт заблокирован';
    end if;
    if new.coll = 'msgs' then
        if length(coalesce(new.data->>'text', '')) not between 1 and 1000 then raise exception 'Сообщение: до 1000 символов'; end if;
        if public.mb_recent('msgs', me, '1 hour') >= 60 then raise exception 'Слишком много сообщений. Подождите немного.'; end if;
    else
        if coalesce((new.data->>'stars')::int, 0) not between 1 and 5 then raise exception 'Оценка: от 1 до 5 звёзд'; end if;
        if length(coalesce(new.data->>'text', '')) > 500 then raise exception 'Отзыв: до 500 символов'; end if;
        if exists (select 1 from public.mb_records where coll = 'reviews' and owner = me and data->>'to' = other) then
            raise exception 'Вы уже оставили отзыв этому продавцу';
        end if;
        if not exists (select 1 from public.mb_records m where m.coll = 'msgs'
                         and ((m.owner = me and m.data->>'to' = other) or (m.owner::text = other and m.data->>'to' = me::text)))
           and not exists (select 1 from public.mb_records c join public.mb_records l on l.coll = 'listings' and l.id = c.data->>'lid'
                         where c.coll = 'comments' and c.owner = me and l.owner::text = other) then
            raise exception 'Отзыв можно оставить после переписки с продавцом';
        end if;
    end if;
    return new;
end $$;
drop trigger if exists mb_chat_guard on public.mb_records;
create trigger mb_chat_guard before insert or update on public.mb_records
    for each row execute function public.mb_chat_guard();

-- Новое сообщение — уведомление получателю (придёт и при закрытом приложении)
create or replace function public.mb_msg_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.coll <> 'msgs' then return new; end if;
    insert into public.mb_records (coll, id, data) values ('notifs', gen_random_uuid()::text, jsonb_build_object(
        'id', gen_random_uuid()::text, 'uid', new.data->>'to', 'read', false, 'chat', (new.data->>'lid') || '|' || (new.data->>'uid'),
        'time', (extract(epoch from now()) * 1000)::bigint,
        'text', 'Сообщение от ' || coalesce((select data->>'name' from public.mb_records where coll = 'users' and id = new.data->>'uid'), '?')
                || ': ' || left(new.data->>'text', 80)));
    return new;
end $$;
drop trigger if exists mb_msg_notify on public.mb_records;
create trigger mb_msg_notify after insert on public.mb_records
    for each row execute function public.mb_msg_notify();

-- =====================================================
-- УВЕДОМЛЕНИЯ В БРАУЗЕР (iPhone, Windows, Android-браузер)
-- Отправляет функция push (supabase/functions/push), секрет VAPID_PRIVATE_KEY.
-- =====================================================
-- Подписки браузеров: адрес службы уведомлений и ключи шифрования
create table if not exists public.mb_push (
    endpoint text primary key check (endpoint like 'https://%' and length(endpoint) < 1000),
    p256dh text not null check (length(p256dh) between 80 and 100),
    auth text not null check (length(auth) between 16 and 40),
    lang text not null default 'ru' check (lang in ('ru', 'tm', 'en')),
    uid uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);
-- Политик нет: таблица доступна только через функции ниже и функции push
alter table public.mb_push enable row level security;

create or replace function public.mb_push_on(p_endpoint text, p_p256dh text, p_auth text, p_lang text)
returns void language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'Нужно войти'; end if;
    insert into public.mb_push (endpoint, p256dh, auth, lang, uid) values (p_endpoint, p_p256dh, p_auth, p_lang, auth.uid())
    on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang, uid = excluded.uid, created_at = now();
    -- Не больше 10 устройств на человека: старые подписки убираем
    delete from public.mb_push where uid = auth.uid() and endpoint not in
        (select endpoint from public.mb_push where uid = auth.uid() order by created_at desc limit 10);
end;
$$;

create or replace function public.mb_push_off(p_endpoint text)
returns void language sql security definer set search_path = public as $$
    delete from public.mb_push where endpoint = p_endpoint;
$$;

revoke execute on function public.mb_push_on(text, text, text, text) from anon;

-- Какие уведомления уже отправлены: функция push шлёт каждое только один раз
create table if not exists public.mb_push_sent (
    id text primary key,
    sent_at timestamptz not null default now()
);
alter table public.mb_push_sent enable row level security;

-- Новое уведомление — просим функцию push отправить его (если у получателя есть подписки)
create extension if not exists pg_net;

create or replace function public.mb_push_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.coll <> 'notifs' or not exists (select 1 from public.mb_push where uid = new.owner) then return new; end if;
    perform net.http_post(
        url := 'https://qjllrvbkwglgcnxteenx.supabase.co/functions/v1/push',
        body := jsonb_build_object('id', new.id),
        headers := jsonb_build_object('Content-Type', 'application/json',
            -- открытый ключ anon (тот же, что в приложении): функция сама берёт уведомление из базы
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbGxydmJrd2dsZ2NueHRlZW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyOTg3NjQsImV4cCI6MjEwODg3NDc2NH0.sg3XKEJZhXAf6n9cR3PvMQXTFpbXID3wNEB3lr7a9Ao')
    );
    return new;
end;
$$;
drop trigger if exists mb_push_notify on public.mb_records;
create trigger mb_push_notify after insert on public.mb_records
    for each row execute function public.mb_push_notify();

