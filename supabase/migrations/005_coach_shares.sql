-- Enlace de solo lectura para el coach (sin cuenta).
-- Ejecutar en: Supabase → SQL Editor → Run
-- El coach abre /coach/{token}. Anon solo puede leer con el token exacto (RPC).

create table if not exists public.coach_shares (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token text not null unique,
  payload jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists coach_shares_token_idx
  on public.coach_shares (token);

alter table public.coach_shares enable row level security;

drop policy if exists "coach_shares_own" on public.coach_shares;
create policy "coach_shares_own"
  on public.coach_shares for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.coach_shares to authenticated;

create or replace function public.get_coach_share(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_token is null or char_length(trim(p_token)) < 16 then
    return null;
  end if;

  select payload
    into result
  from public.coach_shares
  where token = trim(p_token)
    and revoked_at is null;

  return result;
end;
$$;

revoke all on function public.get_coach_share(text) from public;
grant execute on function public.get_coach_share(text) to anon, authenticated;
