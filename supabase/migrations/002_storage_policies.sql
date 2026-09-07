-- Políticas Storage para bucket privado `user-media`
-- Path: {user_id}/...
-- Ejecutar una vez en SQL Editor si aún no las creaste en el dashboard.

insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', false)
on conflict (id) do nothing;

drop policy if exists "user_media_select_own" on storage.objects;
drop policy if exists "user_media_insert_own" on storage.objects;
drop policy if exists "user_media_update_own" on storage.objects;
drop policy if exists "user_media_delete_own" on storage.objects;

create policy "user_media_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_media_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_media_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
