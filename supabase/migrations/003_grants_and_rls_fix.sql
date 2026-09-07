-- Mi Gym: permisos para rol authenticated (sin esto → "permission denied for table …")
-- Ejecutar en: Supabase → SQL Editor → Run

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

grant all on all sequences in schema public to postgres, service_role, authenticated;
grant all on all routines in schema public to postgres, service_role, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant all on sequences to authenticated;

-- Asegurar RLS + policies (por si faltó alguna)
alter table public.routines enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.constancy_goals enable row level security;
alter table public.treadmill_sessions enable row level security;
alter table public.improvements enable row level security;
alter table public.body_check_ins enable row level security;
alter table public.media_assets enable row level security;
alter table public.user_preferences enable row level security;
alter table public.profiles enable row level security;

-- Recrear policy de routines por si quedó mal
drop policy if exists "routines_all_own" on public.routines;
create policy "routines_all_own"
  on public.routines for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sessions_all_own" on public.workout_sessions;
create policy "sessions_all_own"
  on public.workout_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "goals_all_own" on public.constancy_goals;
create policy "goals_all_own"
  on public.constancy_goals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "treadmill_all_own" on public.treadmill_sessions;
create policy "treadmill_all_own"
  on public.treadmill_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "improvements_all_own" on public.improvements;
create policy "improvements_all_own"
  on public.improvements for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "body_check_ins_all_own" on public.body_check_ins;
create policy "body_check_ins_all_own"
  on public.body_check_ins for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "media_assets_all_own" on public.media_assets;
create policy "media_assets_all_own"
  on public.media_assets for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "prefs_select_own" on public.user_preferences;
drop policy if exists "prefs_insert_own" on public.user_preferences;
drop policy if exists "prefs_update_own" on public.user_preferences;
drop policy if exists "prefs_delete_own" on public.user_preferences;

create policy "prefs_select_own"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "prefs_insert_own"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "prefs_update_own"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "prefs_delete_own"
  on public.user_preferences for delete
  to authenticated
  using (auth.uid() = user_id);
