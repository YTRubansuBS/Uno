-- ============================================================
-- ILLEGAL RUNNER — 1V1 SANS MISE
-- À exécuter UNE SEULE FOIS dans Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- TABLE DES DEMANDES
-- ------------------------------------------------------------
create table if not exists public.duel_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 seconds'),
  constraint duel_requests_status_check check (status in ('pending','accepted','declined','cancelled','completed')),
  constraint duel_requests_players_check check (sender_id <> receiver_id)
);

-- ------------------------------------------------------------
-- TABLE DES DUELS
-- ------------------------------------------------------------
create table if not exists public.duel_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.duel_requests(id) on delete cascade,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'lobby',
  choice_a text,
  choice_b text,
  phase_deadline timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  winner_id uuid references public.profiles(id) on delete set null,
  result_reason text,
  lives_a integer not null default 2,
  lives_b integer not null default 2,
  distance_a bigint not null default 0,
  distance_b bigint not null default 0,
  heartbeat_a timestamptz,
  heartbeat_b timestamptz,
  action_a text not null default 'run',
  action_b text not null default 'run',
  y_a double precision,
  y_b double precision,
  action_until_a timestamptz,
  action_until_b timestamptz,
  random_seed bigint,
  updated_at timestamptz not null default now(),
  constraint duel_sessions_status_check check (status in ('lobby','countdown','playing','completed','cancelled')),
  constraint duel_sessions_players_check check (user_a <> user_b)
);

-- Ajout des colonnes si les tables existaient déjà.
alter table public.duel_requests add column if not exists updated_at timestamptz not null default now();
alter table public.duel_requests add column if not exists expires_at timestamptz not null default (now() + interval '30 seconds');
alter table public.duel_sessions add column if not exists choice_a text;
alter table public.duel_sessions add column if not exists choice_b text;
alter table public.duel_sessions add column if not exists phase_deadline timestamptz;
alter table public.duel_sessions add column if not exists started_at timestamptz;
alter table public.duel_sessions add column if not exists ended_at timestamptz;
alter table public.duel_sessions add column if not exists winner_id uuid references public.profiles(id) on delete set null;
alter table public.duel_sessions add column if not exists result_reason text;
alter table public.duel_sessions add column if not exists lives_a integer not null default 2;
alter table public.duel_sessions add column if not exists lives_b integer not null default 2;
alter table public.duel_sessions add column if not exists distance_a bigint not null default 0;
alter table public.duel_sessions add column if not exists distance_b bigint not null default 0;
alter table public.duel_sessions add column if not exists heartbeat_a timestamptz;
alter table public.duel_sessions add column if not exists heartbeat_b timestamptz;
alter table public.duel_sessions add column if not exists action_a text not null default 'run';
alter table public.duel_sessions add column if not exists action_b text not null default 'run';
alter table public.duel_sessions add column if not exists y_a double precision;
alter table public.duel_sessions add column if not exists y_b double precision;
alter table public.duel_sessions add column if not exists action_until_a timestamptz;
alter table public.duel_sessions add column if not exists action_until_b timestamptz;
alter table public.duel_sessions add column if not exists random_seed bigint;
alter table public.duel_sessions add column if not exists updated_at timestamptz not null default now();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.duel_requests enable row level security;
alter table public.duel_sessions enable row level security;

drop policy if exists duel_requests_select on public.duel_requests;
drop policy if exists duel_sessions_select on public.duel_sessions;

create policy duel_requests_select on public.duel_requests
for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy duel_sessions_select on public.duel_sessions
for select using (auth.uid() = user_a or auth.uid() = user_b);

create index if not exists duel_requests_participants_idx
on public.duel_requests(sender_id, receiver_id, status, created_at desc);

create index if not exists duel_sessions_participants_idx
on public.duel_sessions(user_a, user_b, status, updated_at desc);

-- ------------------------------------------------------------
-- DEMANDE DE 1V1
-- ------------------------------------------------------------
create or replace function public.duel_create_request(p_friend_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare rid uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_friend_id is null or p_friend_id = auth.uid() then raise exception 'Invalid friend'; end if;

  if not exists (
    select 1 from public.friends f
    where f.status='accepted'
      and ((f.user_id=auth.uid() and f.friend_id=p_friend_id)
        or (f.user_id=p_friend_id and f.friend_id=auth.uid()))
  ) then
    raise exception 'You are not friends';
  end if;

  select id into rid
  from public.duel_requests
  where public.duel_requests.status='pending'
    and public.duel_requests.expires_at>now()
    and ((public.duel_requests.sender_id=auth.uid() and public.duel_requests.receiver_id=p_friend_id)
      or (public.duel_requests.sender_id=p_friend_id and public.duel_requests.receiver_id=auth.uid()))
  order by created_at desc limit 1;

  if rid is not null then return rid; end if;

  insert into public.duel_requests(sender_id,receiver_id)
  values(auth.uid(),p_friend_id)
  returning id into rid;

  return rid;
end;
$$;

-- ------------------------------------------------------------
-- POLLING DES DEMANDES
-- ------------------------------------------------------------
create or replace function public.duel_poll_requests()
returns table(
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  sender_username text,
  receiver_username text,
  session_id uuid
)
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
begin
  update public.duel_requests dr
  set status='cancelled',updated_at=now()
  where dr.status='pending'
    and dr.expires_at<=now()
    and (dr.sender_id=auth.uid() or dr.receiver_id=auth.uid());

  return query
  select
    r.id,r.sender_id,r.receiver_id,r.status,r.created_at,r.expires_at,
    coalesce(nullif(btrim(ps.username),''),nullif(btrim(us.raw_user_meta_data->>'username'),''),split_part(coalesce(us.email,''),'@',1),'Joueur'),
    coalesce(nullif(btrim(pr.username),''),nullif(btrim(ur.raw_user_meta_data->>'username'),''),split_part(coalesce(ur.email,''),'@',1),'Joueur'),
    s.id
  from public.duel_requests r
  left join public.duel_sessions s on s.request_id=r.id
  left join public.profiles ps on ps.id=r.sender_id
  left join public.profiles pr on pr.id=r.receiver_id
  left join auth.users us on us.id=r.sender_id
  left join auth.users ur on ur.id=r.receiver_id
  where r.sender_id=auth.uid() or r.receiver_id=auth.uid()
  order by r.created_at desc
  limit 30;
end;
$$;

-- ------------------------------------------------------------
-- ACCEPTER / REFUSER
-- ------------------------------------------------------------
create or replace function public.duel_respond_request(p_request_id uuid,p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare r public.duel_requests%rowtype; sid uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into r
  from public.duel_requests
  where id=p_request_id
    and (sender_id=auth.uid() or receiver_id=auth.uid())
  for update;

  if not found then raise exception 'Duel request not found'; end if;

  if r.status='accepted' then
    select id into sid from public.duel_sessions where request_id=r.id limit 1;
    return sid;
  end if;

  if r.status<>'pending' then return null; end if;
  if r.expires_at<=now() then
    update public.duel_requests set status='cancelled',updated_at=now() where id=r.id;
    raise exception 'Duel request expired';
  end if;

  if not p_accept then
    update public.duel_requests set status='declined',updated_at=now() where id=r.id;
    return null;
  end if;

  if r.receiver_id<>auth.uid() then raise exception 'Duel request not for you'; end if;

  insert into public.duel_sessions(
    request_id,user_a,user_b,status,phase_deadline,heartbeat_a,heartbeat_b,lives_a,lives_b
  ) values(
    r.id,r.sender_id,r.receiver_id,'lobby',now()+interval '30 seconds',now(),now(),2,2
  ) on conflict(request_id) do nothing
  returning id into sid;

  if sid is null then
    select id into sid from public.duel_sessions where request_id=r.id limit 1;
  end if;

  update public.duel_requests set status='accepted',updated_at=now() where id=r.id;
  return sid;
end;
$$;

-- ------------------------------------------------------------
-- ANNULER UNE DEMANDE
-- ------------------------------------------------------------
create or replace function public.duel_cancel_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
begin
  update public.duel_requests
  set status='cancelled',updated_at=now()
  where id=p_request_id and sender_id=auth.uid() and status='pending';
  return found;
end;
$$;

-- ------------------------------------------------------------
-- CHOIX PRÊT
-- ------------------------------------------------------------
create or replace function public.duel_set_choice(p_session_id uuid,p_choice text)
returns boolean
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare s public.duel_sessions%rowtype;
begin
  if p_choice<>'ready' then raise exception 'Invalid choice'; end if;

  select * into s from public.duel_sessions
  where id=p_session_id and status='lobby' for update;

  if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then
    raise exception 'Duel not available';
  end if;

  if s.user_a=auth.uid() then
    update public.duel_sessions set choice_a='ready',updated_at=now() where id=s.id;
  else
    update public.duel_sessions set choice_b='ready',updated_at=now() where id=s.id;
  end if;

  return true;
end;
$$;

-- ------------------------------------------------------------
-- SYNCHRONISATION DU DUEL
-- ------------------------------------------------------------
create or replace function public.duel_tick(
  p_session_id uuid,
  p_distance bigint,
  p_lives integer,
  p_y double precision default null,
  p_action text default 'run'
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare
  s public.duel_sessions%rowtype;
  now_ts timestamptz:=now();
  winner uuid;
  clean_action text:=case when p_action in ('run','jump','dash') then p_action else 'run' end;
  my_lives integer:=greatest(0,coalesce(p_lives,0));
begin
  select * into s from public.duel_sessions where id=p_session_id for update;
  if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then
    raise exception 'Duel not found';
  end if;

  if s.user_a=auth.uid() then
    update public.duel_sessions set
      distance_a=greatest(0,coalesce(p_distance,0)),
      lives_a=my_lives,
      heartbeat_a=now_ts,
      y_a=p_y,
      action_a=clean_action,
      action_until_a=case when clean_action='dash' then now_ts+interval '0.65 seconds' else null end,
      updated_at=now_ts
    where id=s.id;
  else
    update public.duel_sessions set
      distance_b=greatest(0,coalesce(p_distance,0)),
      lives_b=my_lives,
      heartbeat_b=now_ts,
      y_b=p_y,
      action_b=clean_action,
      action_until_b=case when clean_action='dash' then now_ts+interval '0.65 seconds' else null end,
      updated_at=now_ts
    where id=s.id;
  end if;

  select * into s from public.duel_sessions where id=s.id;

  if s.status='lobby' then
    if s.choice_a='ready' and s.choice_b='ready' then
      update public.duel_sessions
      set status='countdown',phase_deadline=now_ts+interval '3 seconds',updated_at=now_ts
      where id=s.id;
    elsif s.phase_deadline is not null and s.phase_deadline<=now_ts then
      update public.duel_sessions
      set status='cancelled',result_reason='lobby_timeout',ended_at=now_ts,updated_at=now_ts
      where id=s.id;
    end if;
  end if;

  select * into s from public.duel_sessions where id=s.id;

  if s.status='countdown' and s.phase_deadline is not null and s.phase_deadline<=now_ts then
    update public.duel_sessions
    set status='playing',started_at=now_ts,phase_deadline=null,
        random_seed=coalesce(random_seed,(floor(random()*2147483647))::bigint),
        lives_a=greatest(2,lives_a),lives_b=greatest(2,lives_b),
        heartbeat_a=now_ts,heartbeat_b=now_ts,updated_at=now_ts
    where id=s.id;
  end if;

  select * into s from public.duel_sessions where id=s.id;

  if s.status='playing' and s.started_at is not null and s.started_at<=now_ts-interval '1.5 seconds' then
    if s.lives_a<=0 and s.lives_b<=0 then
      winner:=case when s.distance_a>=s.distance_b then s.user_a else s.user_b end;
    elsif s.lives_a<=0 then
      winner:=s.user_b;
    elsif s.lives_b<=0 then
      winner:=s.user_a;
    elsif s.heartbeat_a is not null and s.heartbeat_a<now_ts-interval '10 seconds' then
      winner:=s.user_b;
    elsif s.heartbeat_b is not null and s.heartbeat_b<now_ts-interval '10 seconds' then
      winner:=s.user_a;
    end if;

    if winner is not null then
      update public.duel_sessions
      set status='completed',winner_id=winner,
          result_reason=case when s.lives_a<=0 or s.lives_b<=0 then 'defeat' else 'disconnect' end,
          ended_at=now_ts,updated_at=now_ts
      where id=s.id;

      update public.duel_requests set status='completed',updated_at=now_ts where id=s.request_id;
    end if;
  end if;

  select * into s from public.duel_sessions where id=s.id;

  return jsonb_build_object(
    'id',s.id,
    'request_id',s.request_id,
    'user_a',s.user_a,
    'user_b',s.user_b,
    'status',s.status,
    'choice_a',s.choice_a,
    'choice_b',s.choice_b,
    'phase_deadline',s.phase_deadline,
    'started_at',s.started_at,
    'ended_at',s.ended_at,
    'winner_id',s.winner_id,
    'result_reason',s.result_reason,
    'lives_a',s.lives_a,
    'lives_b',s.lives_b,
    'distance_a',s.distance_a,
    'distance_b',s.distance_b,
    'heartbeat_a',s.heartbeat_a,
    'heartbeat_b',s.heartbeat_b,
    'action_a',s.action_a,
    'action_b',s.action_b,
    'y_a',s.y_a,
    'y_b',s.y_b,
    'action_until_a',s.action_until_a,
    'action_until_b',s.action_until_b,
    'random_seed',s.random_seed,
    'updated_at',s.updated_at
  );
end;
$$;

-- ------------------------------------------------------------
-- QUITTER LE DUEL
-- ------------------------------------------------------------
create or replace function public.duel_leave(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare s public.duel_sessions%rowtype; winner uuid;
begin
  select * into s from public.duel_sessions where id=p_session_id for update;
  if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Duel not found'; end if;

  if s.status in ('lobby','countdown') then
    update public.duel_sessions set status='cancelled',ended_at=now(),result_reason='left_before_start',updated_at=now() where id=s.id;
    return true;
  end if;

  if s.status='playing' then
    winner:=case when s.user_a=auth.uid() then s.user_b else s.user_a end;
    update public.duel_sessions set status='completed',winner_id=winner,ended_at=now(),result_reason='forfeit',updated_at=now() where id=s.id;
    update public.duel_requests set status='completed',updated_at=now() where id=s.request_id;
  end if;

  return true;
end;
$$;

-- ------------------------------------------------------------
-- NETTOYAGE À LA CONNEXION UNIQUEMENT
-- ------------------------------------------------------------
create or replace function public.duel_clear_incoming_requests()
returns integer
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare removed integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.duel_requests where receiver_id=auth.uid() and status='pending';
  get diagnostics removed=row_count;
  return removed;
end;
$$;

revoke all on function public.duel_create_request(uuid) from public,anon;
revoke all on function public.duel_poll_requests() from public,anon;
revoke all on function public.duel_respond_request(uuid,boolean) from public,anon;
revoke all on function public.duel_cancel_request(uuid) from public,anon;
revoke all on function public.duel_set_choice(uuid,text) from public,anon;
revoke all on function public.duel_tick(uuid,bigint,integer,double precision,text) from public,anon;
revoke all on function public.duel_leave(uuid) from public,anon;
revoke all on function public.duel_clear_incoming_requests() from public,anon;

grant execute on function public.duel_create_request(uuid) to authenticated;
grant execute on function public.duel_poll_requests() to authenticated;
grant execute on function public.duel_respond_request(uuid,boolean) to authenticated;
grant execute on function public.duel_cancel_request(uuid) to authenticated;
grant execute on function public.duel_set_choice(uuid,text) to authenticated;
grant execute on function public.duel_tick(uuid,bigint,integer,double precision,text) to authenticated;
grant execute on function public.duel_leave(uuid) to authenticated;
grant execute on function public.duel_clear_incoming_requests() to authenticated;
