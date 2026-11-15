-- Malta Quest schema + RLS + RPCs
-- Paste into the Supabase SQL editor (EU region). Enable Anonymous sign-ins in Auth first.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references auth.users (id),
  status text not null default 'lobby' check (status in ('lobby', 'live', 'recap')),
  issue_banner text not null,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  alias text not null,
  jersey text not null check (jersey in ('wanderer', 'press', 'peoples', 'democrats')),
  trust int not null default 0,
  unique (room_id, user_id)
);

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  slug text not null check (slug in ('peoples', 'democrats')),
  manifesto text,
  slogan text,
  unique (room_id, slug)
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  party_id uuid not null references public.parties (id) on delete cascade,
  player_id uuid not null references public.players (id),
  name text not null,
  pitch text not null
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  author_id uuid not null references public.players (id),
  title text not null,
  body text not null,
  sticker text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'satire', 'killed')),
  created_at timestamptz not null default now()
);

create table if not exists public.fact_checks (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  checker_id uuid not null references public.players (id),
  rating text not null check (rating in ('run', 'satire', 'needs_source', 'kill')),
  note text
);

create table if not exists public.opinions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  player_id uuid not null references public.players (id),
  body text not null,
  hidden boolean not null default false
);

create table if not exists public.bubbles (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  text text not null,
  source text not null check (source in ('tv', 'manifesto', 'seed', 'rumour')),
  agree_count int not null default 0,
  report_count int not null default 0,
  frozen boolean not null default false
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  prompt text not null,
  kind text not null default 'vote' check (kind in ('vote', 'cloud')),
  status text not null default 'open' check (status in ('open', 'closed'))
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  player_id uuid not null references public.players (id),
  value text not null,
  hidden boolean not null default false,
  unique (poll_id, player_id)
);

create table if not exists public.ballots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.players (id),
  candidate_id uuid not null references public.candidates (id),
  hidden boolean not null default true,
  unique (room_id, player_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  reporter_id uuid not null references public.players (id),
  target_kind text not null check (target_kind in ('story', 'bubble', 'player')),
  target_id uuid not null,
  reason text not null check (reason in ('harassment', 'deepfake', 'privacy', 'unverified', 'smear')),
  resolved boolean not null default false
);

create table if not exists public.round_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  winner_candidate_id uuid references public.candidates (id),
  informed_island boolean not null default false
);

-- Aggregates: others never select raw ballots / poll_votes
create or replace view public.poll_tally as
  select pv.poll_id, pv.value, count(*)::int as count
  from public.poll_votes pv
  group by pv.poll_id, pv.value;

create or replace view public.ballot_tally as
  select b.room_id, b.candidate_id, count(*)::int as count
  from public.ballots b
  group by b.room_id, b.candidate_id;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.in_room(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.players
    where room_id = p_room and user_id = auth.uid()
  ) or exists (
    select 1 from public.rooms
    where id = p_room and host_id = auth.uid()
  );
$$;

create or replace function public.my_player(p_room uuid)
returns public.players
language sql
stable
security definer
set search_path = public
as $$
  select * from public.players
  where room_id = p_room and user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.parties enable row level security;
alter table public.candidates enable row level security;
alter table public.stories enable row level security;
alter table public.fact_checks enable row level security;
alter table public.opinions enable row level security;
alter table public.bubbles enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.ballots enable row level security;
alter table public.reports enable row level security;
alter table public.round_results enable row level security;

create policy rooms_select on public.rooms
  for select using (true);

create policy rooms_insert on public.rooms
  for insert with check (host_id = auth.uid());

create policy rooms_update on public.rooms
  for update using (host_id = auth.uid());

create policy players_select on public.players
  for select using (public.in_room(room_id));

create policy players_insert on public.players
  for insert with check (user_id = auth.uid());

create policy players_update on public.players
  for update using (user_id = auth.uid());

create policy parties_select on public.parties
  for select using (public.in_room(room_id));

create policy parties_write on public.parties
  for all using (
    public.in_room(room_id) and (
      (select jersey from public.my_player(room_id)) = slug
      or exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
    )
  );

create policy candidates_select on public.candidates
  for select using (public.in_room(room_id));

create policy candidates_insert on public.candidates
  for insert with check (
    public.in_room(room_id) and (
      exists (
        select 1 from public.parties p
        join public.players pl on pl.room_id = p.room_id
        where p.id = party_id and pl.user_id = auth.uid() and pl.jersey = p.slug
      )
      or exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
    )
  );

create policy stories_select on public.stories
  for select using (public.in_room(room_id));

create policy stories_insert on public.stories
  for insert with check (
    author_id = (select id from public.my_player(room_id))
  );

create policy fact_checks_select on public.fact_checks
  for select using (
    exists (select 1 from public.stories s where s.id = story_id and public.in_room(s.room_id))
  );

create policy opinions_select on public.opinions
  for select using (public.in_room(room_id) and hidden = false);

create policy opinions_insert on public.opinions
  for insert with check (player_id = (select id from public.my_player(room_id)));

create policy bubbles_select on public.bubbles
  for select using (public.in_room(room_id));

create policy polls_select on public.polls
  for select using (public.in_room(room_id));

create policy poll_votes_insert on public.poll_votes
  for insert with check (
    player_id = (
      select pl.id from public.players pl
      join public.polls po on po.id = poll_id
      where pl.room_id = po.room_id and pl.user_id = auth.uid()
    )
  );

-- no select of others' poll_votes / ballots
create policy ballots_insert on public.ballots
  for insert with check (player_id = (select id from public.my_player(room_id)));

create policy reports_insert on public.reports
  for insert with check (reporter_id = (select id from public.my_player(room_id)));

create policy reports_select on public.reports
  for select using (
    reporter_id = (select id from public.my_player(room_id))
    or exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
  );

create policy round_results_select on public.round_results
  for select using (public.in_room(room_id));

grant select on public.poll_tally to anon, authenticated;
grant select on public.ballot_tally to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.start_room(p_code text, p_banner text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in first';
  end if;
  insert into public.rooms (code, host_id, issue_banner)
  values (upper(p_code), auth.uid(), p_banner)
  returning id into rid;
  insert into public.parties (room_id, slug) values (rid, 'peoples'), (rid, 'democrats');
  insert into public.polls (room_id, prompt, kind, status)
  values (rid, p_banner, 'vote', 'open');
  insert into public.bubbles (room_id, text, source)
  values
    (rid, 'Is the youth centre even open on Sundays?', 'seed'),
    (rid, 'Pastizzi for polling-station snacks. Non-negotiable.', 'seed'),
    (rid, 'Someone said the ferry is haunted. It is not.', 'seed'),
    (rid, 'Who fact-checked the harbour story? Asking for a friend.', 'seed');
  return rid;
end;
$$;

create or replace function public.join_room(p_code text, p_alias text, p_jersey text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
  pid uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in first';
  end if;
  select id into rid from public.rooms where code = upper(p_code);
  if rid is null then
    raise exception 'unknown room';
  end if;
  insert into public.players (room_id, user_id, alias, jersey)
  values (rid, auth.uid(), p_alias, p_jersey)
  on conflict (room_id, user_id) do update
    set alias = excluded.alias, jersey = excluded.jersey
  returning id into pid;
  return pid;
end;
$$;

create or replace function public.start_week(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rooms
     set status = 'live',
         started_at = now(),
         ends_at = now() + interval '8 minutes'
   where id = p_room_id and host_id = auth.uid();
end;
$$;

create or replace function public.fact_check_story(p_story_id uuid, p_rating text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.stories%rowtype;
  checker public.players%rowtype;
  new_status text;
begin
  select * into s from public.stories where id = p_story_id;
  if not found then raise exception 'no story'; end if;
  select * into checker from public.my_player(s.room_id);
  if checker.id is null then raise exception 'join first'; end if;
  if checker.id = s.author_id then
    raise exception 'cannot stamp your own story';
  end if;
  if checker.jersey <> 'press' then
    -- host bypass
    if not exists (select 1 from public.rooms r where r.id = s.room_id and r.host_id = auth.uid()) then
      raise exception 'press jersey required';
    end if;
  end if;
  insert into public.fact_checks (story_id, checker_id, rating, note)
  values (p_story_id, checker.id, p_rating, p_note);
  new_status := case p_rating
    when 'run' then 'approved'
    when 'kill' then 'killed'
    when 'satire' then 'satire'
    else s.status
  end;
  update public.stories set status = new_status where id = p_story_id;
  if new_status = 'approved' then
    insert into public.bubbles (room_id, text, source) values (s.room_id, s.title, 'tv');
  elsif new_status = 'killed' then
    insert into public.bubbles (room_id, text, source)
    values (s.room_id, 'Heard that ' || lower(s.title) || '… wait, was that killed?', 'rumour');
  end if;
end;
$$;

create or replace function public.agree_bubble(p_bubble_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bubbles
     set agree_count = agree_count + 1
   where id = p_bubble_id and frozen = false;
end;
$$;

create or replace function public.report_bubble(p_bubble_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bubbles%rowtype;
  reporter public.players%rowtype;
begin
  select * into b from public.bubbles where id = p_bubble_id;
  select * into reporter from public.my_player(b.room_id);
  insert into public.reports (room_id, reporter_id, target_kind, target_id, reason)
  values (b.room_id, reporter.id, 'bubble', p_bubble_id, p_reason);
  update public.bubbles
     set report_count = report_count + 1,
         frozen = (report_count + 1) >= 2
   where id = p_bubble_id;
end;
$$;

create or replace function public.cast_ballot(p_room_id uuid, p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.players%rowtype;
begin
  select * into me from public.my_player(p_room_id);
  insert into public.ballots (room_id, player_id, candidate_id, hidden)
  values (p_room_id, me.id, p_candidate_id, true);
end;
$$;

create or replace function public.close_round(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  winner uuid;
  rumour_agrees int;
  rumour_reports int;
  checked boolean;
begin
  if not exists (select 1 from public.rooms where id = p_room_id and host_id = auth.uid()) then
    raise exception 'host only';
  end if;
  select candidate_id into winner
    from public.ballot_tally
   where room_id = p_room_id
   order by count desc
   limit 1;
  select coalesce(sum(agree_count),0), coalesce(sum(report_count),0)
    into rumour_agrees, rumour_reports
    from public.bubbles where room_id = p_room_id and source = 'rumour';
  select exists (
    select 1 from public.stories where room_id = p_room_id and status <> 'draft'
  ) into checked;
  insert into public.round_results (room_id, winner_candidate_id, informed_island)
  values (p_room_id, winner, checked and rumour_reports >= rumour_agrees);
  update public.rooms set status = 'recap' where id = p_room_id;
end;
$$;

grant execute on function public.start_room(text, text) to authenticated, anon;
grant execute on function public.join_room(text, text, text) to authenticated, anon;
grant execute on function public.start_week(uuid) to authenticated, anon;
grant execute on function public.fact_check_story(uuid, text, text) to authenticated, anon;
grant execute on function public.agree_bubble(uuid) to authenticated, anon;
grant execute on function public.report_bubble(uuid, text) to authenticated, anon;
grant execute on function public.cast_ballot(uuid, uuid) to authenticated, anon;
grant execute on function public.close_round(uuid) to authenticated, anon;

-- Realtime
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.parties;
alter publication supabase_realtime add table public.candidates;
alter publication supabase_realtime add table public.stories;
alter publication supabase_realtime add table public.bubbles;
alter publication supabase_realtime add table public.polls;
