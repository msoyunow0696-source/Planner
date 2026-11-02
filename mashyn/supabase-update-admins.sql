-- =====================================================
-- AlphaCars — защита администраторов
-- Supabase → SQL Editor → вставить целиком → Run (один раз). То же самое есть в конце supabase-setup.sql.
-- В приложении администратор может назначить другого администратора. Этот файл не даёт
-- одному администратору снять роль или заблокировать другого: роль администратора
-- снимает только он сам (в своём профиле) или владелец здесь, в SQL Editor.
-- =====================================================

create or replace function public.mb_admin_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    -- Только профили, где сейчас администратор; SQL Editor (без входа в приложение) — можно всё
    if new.coll <> 'users' or coalesce(old.data->>'role', '') <> 'admin' or auth.uid() is null then return new; end if;
    if new.id = auth.uid()::text then return new; end if;
    if (new.data->'role') is distinct from (old.data->'role') then
        raise exception 'Роль администратора может снять только он сам';
    end if;
    if coalesce((new.data->>'blocked')::boolean, false) and not coalesce((old.data->>'blocked')::boolean, false) then
        raise exception 'Администратора заблокировать нельзя';
    end if;
    return new;
end;
$$;
drop trigger if exists mb_admin_guard on public.mb_records;
create trigger mb_admin_guard before update on public.mb_records
    for each row execute function public.mb_admin_guard();
