-- =====================================================
-- AlphaCars TM — до 5 автосалонов у одного пользователя (было 1)
-- Supabase → SQL Editor → вставить целиком → Run (один раз). То же самое есть в конце supabase-setup.sql.
-- Меняется только проверка при создании салона; остальные правила — как в supabase-update-dealers.sql.
-- =====================================================

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
        if (select count(*) from public.mb_records where coll = 'dealers' and owner = auth.uid()) >= 5 then
            raise exception 'Не больше 5 салонов на один аккаунт';
        end if;
        new.data := new.data || '{"hidden":false}';
    elsif (new.data->'hidden') is distinct from (old.data->'hidden') then
        raise exception 'Скрыть или показать салон может только администрация';
    end if;
    return new;
end;
$$;
