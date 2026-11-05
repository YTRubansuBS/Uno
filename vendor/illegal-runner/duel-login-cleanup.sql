-- ILLEGAL RUNNER — nettoyage des demandes 1V1 entrantes à la connexion
-- À exécuter une fois dans Supabase SQL Editor.

create or replace function public.duel_clear_incoming_requests()
returns integer
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare
  removed integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.duel_requests
  where receiver_id=auth.uid()
    and status='pending';

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.duel_clear_incoming_requests() from public,anon;
grant execute on function public.duel_clear_incoming_requests() to authenticated;
