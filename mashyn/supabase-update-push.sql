-- =====================================================
-- Alpha Drive — уведомления в браузер (iPhone, Windows, Android-браузер)
-- Supabase → SQL Editor → вставить целиком → Run (один раз).
-- Перед этим задеплойте функцию push (mashyn/supabase/functions/push/index.ts)
-- и добавьте секрет VAPID_PRIVATE_KEY.
-- То же самое есть в конце supabase-setup.sql.
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

