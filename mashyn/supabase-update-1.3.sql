-- =====================================================
-- Alpha Drive 1.3 — обновление базы
-- Supabase → SQL Editor → вставить целиком → Run (один раз).
-- Что добавляет: статус «Продано», чат покупатель ↔ продавец, отзывы о продавцах.
-- То же самое уже есть в конце supabase-setup.sql — этот файл, чтобы не запускать всю схему заново.
-- =====================================================

-- Проверки при записи: продавец может сам отметить «Продано»
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
