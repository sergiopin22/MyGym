-- Preferencia de unidad de peso (lb canónico en datos; kg solo display)
-- Ejecutar en SQL Editor de Supabase

alter table public.user_preferences
  add column if not exists weight_unit text
  check (weight_unit is null or weight_unit in ('lb', 'kg'));
