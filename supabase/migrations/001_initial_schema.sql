-- Mi Gym — esquema inicial Supabase (Postgres)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Todo lleva user_id + RLS: cada usuario solo ve lo suyo.

create extension if not exists "pgcrypto";

-- Perfil mínimo (1 fila por auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Preferencias UI (tema, Focus/Clásico, acento, avatar)
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme_id text,
  ui_layout text,
  focus_accent text,
  brand_avatar_id text,
  avatar_mode text,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "prefs_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "prefs_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "prefs_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "prefs_delete_own"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Rutina (incluye días, ejercicios, alternativas, agarres, mantenimiento)
create table if not exists public.routines (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create index if not exists routines_user_updated_idx
  on public.routines (user_id, updated_at desc);

alter table public.routines enable row level security;

create policy "routines_all_own"
  on public.routines for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sesiones de gym (historial + series + alternativas usadas + recovery)
-- Los cuadritos del heatmap se calculan desde date + status=completed
create table if not exists public.workout_sessions (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id text not null,
  routine_day_id text not null,
  day_label text not null,
  muscle_groups jsonb not null default '[]'::jsonb,
  date date not null,
  status text not null check (status in ('in_progress', 'completed')),
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_ms bigint,
  exercises jsonb not null default '[]'::jsonb,
  is_recovery boolean default false,
  recovered_weekday smallint,
  recovered_day_label text,
  edited_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists workout_sessions_user_date_idx
  on public.workout_sessions (user_id, date desc);

create index if not exists workout_sessions_user_status_idx
  on public.workout_sessions (user_id, status);

alter table public.workout_sessions enable row level security;

create policy "sessions_all_own"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Meta de constancia (progreso, fallos, penitencia, premio, semanas)
create table if not exists public.constancy_goals (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  target_count integer not null,
  current_count integer not null default 0,
  prize_preset text not null,
  prize_label text not null,
  status text not null check (status in ('active', 'completed')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  completed_at timestamptz,
  consecutive_misses integer not null default 0,
  last_evaluated_date date,
  recovery_week_key text,
  reset_week_key text,
  penance_week_key text,
  penance_label text,
  primary key (user_id, id)
);

create index if not exists constancy_goals_user_status_idx
  on public.constancy_goals (user_id, status);

alter table public.constancy_goals enable row level security;

create policy "goals_all_own"
  on public.constancy_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Caminadora
create table if not exists public.treadmill_sessions (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  created_at timestamptz not null,
  speed_mph double precision not null,
  incline_percent double precision not null,
  duration_minutes integer not null,
  duration_seconds integer not null,
  calories double precision not null,
  note text,
  primary key (user_id, id)
);

create index if not exists treadmill_user_date_idx
  on public.treadmill_sessions (user_id, date desc);

alter table public.treadmill_sessions enable row level security;

create policy "treadmill_all_own"
  on public.treadmill_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Mejoras detectadas (opcional pero útil)
create table if not exists public.improvements (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_name text not null,
  routine_exercise_id text not null,
  session_id text not null,
  type text not null,
  message text not null,
  detected_at timestamptz not null,
  previous_best jsonb,
  current_best jsonb,
  primary key (user_id, id)
);

alter table public.improvements enable row level security;

create policy "improvements_all_own"
  on public.improvements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Check-ins corporales (medidas)
create table if not exists public.body_check_ins (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  created_at timestamptz not null,
  weight_lb double precision not null,
  biceps_cm double precision not null,
  waist_cm double precision not null,
  chest_cm double precision not null,
  thigh_cm double precision not null,
  note text,
  primary key (user_id, id)
);

alter table public.body_check_ins enable row level security;

create policy "body_check_ins_all_own"
  on public.body_check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Metadatos de archivos en Storage (GIF avatar, fotos cuerpo, imágenes ejercicio)
-- Los blobs van a bucket `user-media` en path: {user_id}/...
create table if not exists public.media_assets (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'avatar_gif',
    'exercise_image',
    'body_photo'
  )),
  storage_path text not null,
  mime_type text not null,
  related_id text,
  angle text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.media_assets enable row level security;

create policy "media_assets_all_own"
  on public.media_assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bucket de medios (ejecutar también en Storage o vía dashboard)
-- insert into storage.buckets (id, name, public) values ('user-media', 'user-media', false)
-- on conflict do nothing;
-- Políticas Storage: solo el dueño lee/escribe en {user_id}/...
