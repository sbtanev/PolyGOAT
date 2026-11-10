-- =====================================================================
-- PolyGOAT – parts 3 & 4: reading texts, journey map, XP and leaderboard
-- Paste this whole file into Supabase → SQL Editor → Run. Run it once,
-- after 0002_learning.sql.
-- =====================================================================

-- Map view per language: {"bounds": [[west, south], [east, north]]}
alter table public.languages add column if not exists map jsonb not null default '{}';

create table public.readings (
  id             text primary key,
  language_code  text not null references public.languages on delete cascade,
  section_id     text references public.sections on delete set null,
  level          text not null default 'A1',
  title          jsonb not null,
  sentences      jsonb not null default '[]',    -- [{"text": "...", "translations": {...}}]
  glossary       jsonb not null default '{}',    -- {"palabra": {"item": "es-palabra", "translations": {...}}}
  sort_order     int not null default 0
);

create table public.map_places (
  id                   text primary key,
  language_code        text not null references public.languages on delete cascade,
  section_id           text references public.sections on delete set null,
  name                 text not null,
  country              text,
  lat                  double precision not null,
  lng                  double precision not null,
  description          jsonb not null default '{}',
  unlock_after_lesson  text references public.lessons on delete set null,  -- null = open from the start
  local_item_ids       text[] not null default '{}',
  culture_note_id      text references public.culture_notes on delete set null,
  reading_id           text references public.readings on delete set null,
  sort_order           int not null default 0
);

do $$
declare t text;
begin
  foreach t in array array['readings','map_places'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members read %1$s" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "admins write %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- XP, streaks, leaderboard
-- ---------------------------------------------------------------------
create table public.xp_events (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.profiles on delete cascade,
  language_code  text references public.languages on delete set null,
  amount         int not null check (amount between 0 and 100),
  reason         text not null,          -- lesson, review, dialogue, reading, practice
  ref            text,
  created_at     timestamptz not null default now()
);
create index xp_events_user_idx on public.xp_events (user_id, created_at desc);
create index xp_events_time_idx on public.xp_events (created_at);

alter table public.xp_events enable row level security;
create policy "own xp" on public.xp_events for select to authenticated using (user_id = auth.uid());
create policy "add own xp" on public.xp_events for insert to authenticated with check (user_id = auth.uid());
create policy "admins read xp" on public.xp_events for select to authenticated using (public.is_admin());

-- The group's clock: weeks start on Monday, Helsinki time.
create or replace function public.week_start(p_weeks_ago int default 0)
returns timestamptz language sql stable as $$
  select (date_trunc('week', now() at time zone 'Europe/Helsinki') - make_interval(weeks => p_weeks_ago))
         at time zone 'Europe/Helsinki';
$$;

-- Everyone's XP for a week (0 = this week, 1 = last week). Visible to all members.
create or replace function public.weekly_leaderboard(p_weeks_ago int default 0)
returns table (user_id uuid, username text, display_name text, avatar_url text, avatar_preset text, xp bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.username::text, p.display_name, p.avatar_url, p.avatar_preset, coalesce(sum(x.amount), 0) as xp
  from public.profiles p
  left join public.xp_events x
    on x.user_id = p.id
   and x.created_at >= public.week_start(p_weeks_ago)
   and x.created_at <  public.week_start(p_weeks_ago) + interval '1 week'
  where auth.uid() is not null
  group by p.id
  order by xp desc, p.display_name;
$$;
grant execute on function public.weekly_leaderboard(int) to authenticated;

create or replace function public.total_xp(p_user uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount), 0) from public.xp_events where user_id = p_user and auth.uid() is not null;
$$;
grant execute on function public.total_xp(uuid) to authenticated;
