-- UNO Online / Supabase schema
-- Apply this file in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 20),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  user_low uuid generated always as (least(requester_id, addressee_id)) stored,
  user_high uuid generated always as (greatest(requester_id, addressee_id)) stored,
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (user_low, user_high)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  state jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{"maxPlayers":4}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  seat int not null check (seat between 0 and 3),
  card_count int not null default 0 check (card_count >= 0),
  ready boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, seat)
);

create table if not exists public.room_hands (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hand jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.room_actions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action jsonb not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_room_players_room on public.room_players(room_id, seat);
create index if not exists idx_room_actions_pending on public.room_actions(room_id, processed_at, created_at);
create index if not exists idx_profiles_username on public.profiles(username);

create schema if not exists private;

create or replace function private.is_room_member(p_room_id uuid)
returns boolean language sql security definer stable set search_path = public, pg_temp
as $$ select exists (select 1 from public.room_players where room_id = p_room_id and user_id = (select auth.uid())); $$;

create or replace function private.is_room_host(p_room_id uuid)
returns boolean language sql security definer stable set search_path = public, pg_temp
as $$ select exists (select 1 from public.rooms where id = p_room_id and host_id = (select auth.uid())); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare base text; candidate text;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email,'player'),'@',1), 'player'), '[^a-zA-Z0-9_]+', '', 'g'));
  base := left(case when char_length(base) < 2 then 'player' else base end, 15);
  candidate := base || '_' || substr(new.id::text, 1, 4);
  insert into public.profiles(id, username, display_name) values(new.id, candidate, candidate) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.touch_room_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists rooms_touch_updated_at on public.rooms;
create trigger rooms_touch_updated_at before update on public.rooms for each row execute procedure public.touch_room_updated_at();

create or replace function public.touch_hand_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists room_hands_touch_updated_at on public.room_hands;
create trigger room_hands_touch_updated_at before update on public.room_hands for each row execute procedure public.touch_hand_updated_at();

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_hands enable row level security;
alter table public.room_actions enable row level security;

revoke all on public.profiles, public.friendships, public.rooms, public.room_players, public.room_hands, public.room_actions from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.room_players to authenticated;
grant select, insert, update, delete on public.room_hands to authenticated;
grant select, insert, update on public.room_actions to authenticated;

drop policy if exists profiles_read_authenticated on public.profiles;
create policy profiles_read_authenticated on public.profiles for select to authenticated using (true);
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists friendships_read_related on public.friendships;
create policy friendships_read_related on public.friendships for select to authenticated using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);
drop policy if exists friendships_insert_self on public.friendships;
create policy friendships_insert_self on public.friendships for insert to authenticated with check ((select auth.uid()) = requester_id and requester_id <> addressee_id);
drop policy if exists friendships_update_related on public.friendships;
create policy friendships_update_related on public.friendships for update to authenticated using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id) with check ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);
drop policy if exists friendships_delete_related on public.friendships;
create policy friendships_delete_related on public.friendships for delete to authenticated using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

drop policy if exists rooms_read_access on public.rooms;
create policy rooms_read_access on public.rooms for select to authenticated using ((select auth.uid()) = host_id or private.is_room_member(id) or status = 'waiting');
drop policy if exists rooms_insert_host on public.rooms;
create policy rooms_insert_host on public.rooms for insert to authenticated with check ((select auth.uid()) = host_id);
drop policy if exists rooms_update_host on public.rooms;
create policy rooms_update_host on public.rooms for update to authenticated using ((select auth.uid()) = host_id) with check ((select auth.uid()) = host_id);
drop policy if exists rooms_delete_host on public.rooms;
create policy rooms_delete_host on public.rooms for delete to authenticated using ((select auth.uid()) = host_id);

drop policy if exists room_players_read_member on public.room_players;
create policy room_players_read_member on public.room_players for select to authenticated using (private.is_room_member(room_id) or private.is_room_host(room_id));
drop policy if exists room_players_insert_self_waiting on public.room_players;
create policy room_players_insert_self_waiting on public.room_players for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.rooms where id = room_id and status = 'waiting'));
drop policy if exists room_players_update_self_or_host on public.room_players;
create policy room_players_update_self_or_host on public.room_players for update to authenticated using ((select auth.uid()) = user_id or private.is_room_host(room_id)) with check ((select auth.uid()) = user_id or private.is_room_host(room_id));
drop policy if exists room_players_delete_self_or_host on public.room_players;
create policy room_players_delete_self_or_host on public.room_players for delete to authenticated using ((select auth.uid()) = user_id or private.is_room_host(room_id));

drop policy if exists room_hands_read_self_or_host on public.room_hands;
create policy room_hands_read_self_or_host on public.room_hands for select to authenticated using ((select auth.uid()) = user_id or private.is_room_host(room_id));
drop policy if exists room_hands_insert_self_or_host on public.room_hands;
create policy room_hands_insert_self_or_host on public.room_hands for insert to authenticated with check ((select auth.uid()) = user_id or private.is_room_host(room_id));
drop policy if exists room_hands_update_self_or_host on public.room_hands;
create policy room_hands_update_self_or_host on public.room_hands for update to authenticated using ((select auth.uid()) = user_id or private.is_room_host(room_id)) with check ((select auth.uid()) = user_id or private.is_room_host(room_id));
drop policy if exists room_hands_delete_self_or_host on public.room_hands;
create policy room_hands_delete_self_or_host on public.room_hands for delete to authenticated using ((select auth.uid()) = user_id or private.is_room_host(room_id));

drop policy if exists room_actions_read_host_or_self on public.room_actions;
create policy room_actions_read_host_or_self on public.room_actions for select to authenticated using ((select auth.uid()) = user_id or private.is_room_host(room_id));
drop policy if exists room_actions_insert_self_member on public.room_actions;
create policy room_actions_insert_self_member on public.room_actions for insert to authenticated with check ((select auth.uid()) = user_id and private.is_room_member(room_id));
drop policy if exists room_actions_update_host on public.room_actions;
create policy room_actions_update_host on public.room_actions for update to authenticated using (private.is_room_host(room_id)) with check (private.is_room_host(room_id));

do $$ begin alter publication supabase_realtime add table public.rooms; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.room_players; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.room_hands; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.room_actions; exception when duplicate_object then null; end $$;

-- Supabase Auth: enable Email/Password in the Auth provider settings.
-- Browser code must use only the publishable/anon key, never service_role.