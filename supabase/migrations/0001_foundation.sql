-- =====================================================================
-- PolyGOAT – part 1: languages, profiles, invite codes, avatars
-- Paste this whole file into Supabase → SQL Editor → Run. Run it once.
-- =====================================================================

create extension if not exists citext;

-- ---------------------------------------------------------------------
-- Base (source) languages: the languages people learn FROM.
-- A sixth base language later = one new row here, no code changes.
-- ---------------------------------------------------------------------
create table public.base_languages (
  code        text primary key,
  name        jsonb not null,          -- {"en": "Bulgarian", "bg": "Български", ...}
  flag        text not null,
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);

-- ---------------------------------------------------------------------
-- Target languages: the languages people LEARN (one per content pack).
-- ---------------------------------------------------------------------
create table public.languages (
  code              text primary key,
  name              jsonb not null,
  native_name       text not null,
  flag              text not null,
  script            text not null default 'latin',   -- latin, cyrillic, hanzi, hangul, kana-kanji...
  features          jsonb not null default '[]',      -- ["gender","cases","tones",...]
  mascot_accessory  text,                              -- sombrero, beret, laurel, beanie, alpine...
  is_active         boolean not null default false,    -- shown to learners when true
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Profiles (one per account)
-- ---------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  username       citext not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name   text not null check (char_length(display_name) between 1 and 50),
  bio            text check (char_length(bio) <= 200),
  avatar_url     text,
  avatar_preset  text not null default 'classic',
  role           text not null default 'user' check (role in ('user', 'admin')),
  last_seen_at   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create table public.invite_codes (
  code        text primary key,
  max_uses    int not null default 1 check (max_uses > 0),
  uses        int not null default 0,
  note        text,
  created_by  uuid references public.profiles on delete set null,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table public.user_languages (
  user_id          uuid not null references public.profiles on delete cascade,
  language_code    text not null references public.languages on delete cascade,
  source_language  text not null references public.base_languages,
  level            text not null default 'A1' check (level in ('A1','A2','B1','B2','C1','C2')),
  started_at       timestamptz not null default now(),
  primary key (user_id, language_code),
  check (language_code <> source_language)   -- a language can't be learned from itself
);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.check_invite_code(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invite_codes
    where upper(code) = upper(trim(p_code))
      and uses < max_uses
      and (expires_at is null or expires_at > now())
  );
$$;

create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where username = p_username::citext);
$$;

create or replace function public.touch_last_seen()
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now()
  where id = auth.uid() and last_seen_at < now() - interval '1 minute';
$$;

grant execute on function public.check_invite_code(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.touch_last_seen() to authenticated;

-- New account → validate the invite code and create the profile.
-- The very first account ever created becomes the admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code     text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
  v_username text := coalesce(nullif(new.raw_user_meta_data ->> 'username', ''),
                              'goat_' || substr(replace(new.id::text, '-', ''), 1, 8));
  v_display  text := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username);
  v_invite   public.invite_codes;
begin
  select * into v_invite from public.invite_codes
  where upper(code) = v_code for update;

  if v_invite.code is null
     or v_invite.uses >= v_invite.max_uses
     or (v_invite.expires_at is not null and v_invite.expires_at <= now()) then
    raise exception 'INVALID_INVITE_CODE';
  end if;

  update public.invite_codes set uses = uses + 1 where code = v_invite.code;

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id, v_username, left(v_display, 50),
    case when exists (select 1 from public.profiles where role = 'admin') then 'user' else 'admin' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change roles (the SQL editor, where auth.uid() is null, may too).
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.base_languages enable row level security;
alter table public.languages      enable row level security;
alter table public.profiles       enable row level security;
alter table public.invite_codes   enable row level security;
alter table public.user_languages enable row level security;

create policy "base languages are public" on public.base_languages for select using (true);
create policy "admins manage base languages" on public.base_languages for all
  using (public.is_admin()) with check (public.is_admin());

create policy "languages are public" on public.languages for select using (true);
create policy "admins manage languages" on public.languages for all
  using (public.is_admin()) with check (public.is_admin());

create policy "members see profiles" on public.profiles for select to authenticated using (true);
create policy "users edit own profile" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "admins manage invite codes" on public.invite_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "members see who learns what" on public.user_languages for select to authenticated using (true);
create policy "users add own languages" on public.user_languages for insert to authenticated
  with check (user_id = auth.uid());
create policy "users update own languages" on public.user_languages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users remove own languages" on public.user_languages for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Avatar storage (public bucket, each user writes only to their own folder)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "users upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users replace own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- Starter data
-- ---------------------------------------------------------------------
insert into public.base_languages (code, name, flag, sort_order) values
  ('bg', '{"en":"Bulgarian","bg":"Български","de":"Bulgarisch","fr":"bulgare","es":"búlgaro"}', '🇧🇬', 1),
  ('en', '{"en":"English","bg":"Английски","de":"Englisch","fr":"anglais","es":"inglés"}',     '🇬🇧', 2),
  ('fr', '{"en":"French","bg":"Френски","de":"Französisch","fr":"français","es":"francés"}',   '🇫🇷', 3),
  ('de', '{"en":"German","bg":"Немски","de":"Deutsch","fr":"allemand","es":"alemán"}',         '🇩🇪', 4),
  ('es', '{"en":"Spanish","bg":"Испански","de":"Spanisch","fr":"espagnol","es":"español"}',    '🇪🇸', 5);

insert into public.languages (code, name, native_name, flag, script, features, mascot_accessory, is_active, sort_order) values
  ('es', '{"en":"Spanish","bg":"Испански","de":"Spanisch","fr":"espagnol","es":"español"}', 'Español', '🇪🇸', 'latin', '["gender"]', 'sombrero', true, 1),
  ('fi', '{"en":"Finnish","bg":"Фински","de":"Finnisch","fr":"finnois","es":"finés"}',      'Suomi',   '🇫🇮', 'latin', '["cases","consonant_gradation"]', 'beanie', true, 2),
  ('fr', '{"en":"French","bg":"Френски","de":"Französisch","fr":"français","es":"francés"}', 'Français', '🇫🇷', 'latin', '["gender"]', 'beret', false, 3),
  ('de', '{"en":"German","bg":"Немски","de":"Deutsch","fr":"allemand","es":"alemán"}',      'Deutsch', '🇩🇪', 'latin', '["gender","cases"]', 'alpine', false, 4),
  ('la', '{"en":"Latin","bg":"Латински","de":"Latein","fr":"latin","es":"latín"}',          'Lingua Latina', '🏛️', 'latin', '["gender","cases"]', 'laurel', false, 5);

-- The first invite code. The person who uses it first becomes the admin.
insert into public.invite_codes (code, max_uses, note) values ('GOAT-START', 1, 'First admin');
