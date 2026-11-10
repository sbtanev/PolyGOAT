-- =====================================================================
-- PolyGOAT – permanent invite links with admin approval
-- Paste this whole file into Supabase → SQL Editor → Run. Run it once,
-- after 0003_reading_map_xp.sql.
-- =====================================================================

-- An invite code can require the admin to approve everyone who uses it.
alter table public.invite_codes add column if not exists requires_approval boolean not null default false;

-- pending = signed up, waiting for approval; active = member; rejected = turned down.
alter table public.profiles add column if not exists status text not null default 'active'
  check (status in ('pending', 'active', 'rejected'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code     text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
  v_username text := coalesce(nullif(new.raw_user_meta_data ->> 'username', ''),
                              'goat_' || substr(replace(new.id::text, '-', ''), 1, 8));
  v_display  text := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username);
  v_invite   public.invite_codes;
  v_first    boolean;
begin
  select * into v_invite from public.invite_codes
  where upper(code) = v_code for update;

  if v_invite.code is null
     or v_invite.uses >= v_invite.max_uses
     or (v_invite.expires_at is not null and v_invite.expires_at <= now()) then
    raise exception 'INVALID_INVITE_CODE';
  end if;

  update public.invite_codes set uses = uses + 1 where code = v_invite.code;

  v_first := not exists (select 1 from public.profiles where role = 'admin');

  insert into public.profiles (id, username, display_name, role, status)
  values (
    new.id, v_username, left(v_display, 50),
    case when v_first then 'admin' else 'user' end,
    case when v_invite.requires_approval and not v_first then 'pending' else 'active' end
  );
  return new;
end;
$$;

-- Only admins may change roles or membership status.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role <> old.role or new.status <> old.status)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change roles or membership status';
  end if;
  return new;
end;
$$;

-- Pending and rejected people don't appear on the leaderboard.
create or replace function public.weekly_leaderboard(p_weeks_ago int default 0)
returns table (user_id uuid, username text, display_name text, avatar_url text, avatar_preset text, xp bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.username::text, p.display_name, p.avatar_url, p.avatar_preset, coalesce(sum(x.amount), 0) as xp
  from public.profiles p
  left join public.xp_events x
    on x.user_id = p.id
   and x.created_at >= public.week_start(p_weeks_ago)
   and x.created_at <  public.week_start(p_weeks_ago) + interval '1 week'
  where auth.uid() is not null and p.status = 'active'
  group by p.id
  order by xp desc, p.display_name;
$$;
