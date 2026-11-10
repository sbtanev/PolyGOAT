-- =====================================================================
-- PolyGOAT – part 2: course content, spaced repetition, notebook
-- Paste this whole file into Supabase → SQL Editor → Run. Run it once,
-- after 0001_foundation.sql.
--
-- Translatable fields are JSON objects keyed by base language code:
--   {"bg": "нощ", "en": "night", "de": "Nacht", "fr": "nuit"}
-- A new base language is just a new key: no schema change needed.
-- `translation_status` uses the same keys: {"bg": "verified", "fr": "auto"}.
-- =====================================================================

alter table public.languages add column if not exists pack_version text;
alter table public.languages add column if not exists varieties jsonb not null default '[]';
alter table public.languages add column if not exists tts_locale text;     -- e.g. es-ES, fi-FI

-- Themed sections inside a language ("core", "exam", "history", "medicine"...)
create table public.sections (
  id                  text primary key,                 -- "fi-exam"
  language_code       text not null references public.languages on delete cascade,
  slug                text not null,
  title               jsonb not null,
  description         jsonb not null default '{}',
  unlock_after_level  text,                              -- null = open from the start
  sort_order          int not null default 0,
  unique (language_code, slug)
);

-- Words and phrases: everything that can go into the review queue
create table public.items (
  id                  text primary key,                 -- "es-noche"
  language_code       text not null references public.languages on delete cascade,
  kind                text not null default 'word' check (kind in ('word', 'phrase', 'sentence')),
  text                text not null,
  translations        jsonb not null default '{}',
  translation_status  jsonb not null default '{}',
  pos                 text,                              -- noun, verb, adjective...
  gender              text,
  frequency_rank      int,
  native              text,                              -- how a native would actually say it
  slang               jsonb not null default '{}',       -- {"es-MX": "¿Qué onda?", "es-AR": "¿Qué hacés?"}
  notes               jsonb not null default '{}',
  extras              jsonb not null default '{}',       -- script-specific data: pinyin, furigana, cases...
  audio_url           text,
  created_at          timestamptz not null default now()
);
create index items_language_idx on public.items (language_code);

create table public.grammar_notes (
  id             text primary key,
  language_code  text not null references public.languages on delete cascade,
  level          text,
  title          jsonb not null,
  body           jsonb not null,                         -- Markdown per base language
  sort_order     int not null default 0
);

create table public.culture_notes (
  id             text primary key,
  language_code  text not null references public.languages on delete cascade,
  title          jsonb not null,
  body           jsonb not null,
  sort_order     int not null default 0
);

create table public.lessons (
  id             text primary key,                       -- "es-a1-01"
  language_code  text not null references public.languages on delete cascade,
  section_id     text references public.sections on delete set null,
  level          text not null default 'A1',
  title          jsonb not null,
  description    jsonb not null default '{}',
  item_ids       text[] not null default '{}',
  grammar_ids    text[] not null default '{}',
  exercises      jsonb not null default '[]',             -- authored exercises (fill-in, order words...)
  sort_order     int not null default 0
);
create index lessons_language_idx on public.lessons (language_code, sort_order);

create table public.phrase_packs (
  id             text primary key,                        -- "es-airport"
  language_code  text not null references public.languages on delete cascade,
  level          text not null default 'A1',
  icon           text,
  title          jsonb not null,
  description    jsonb not null default '{}',
  item_ids       text[] not null default '{}',
  sort_order     int not null default 0
);

create table public.dialogues (
  id             text primary key,
  language_code  text not null references public.languages on delete cascade,
  level          text not null default 'A1',
  icon           text,
  title          jsonb not null,
  situation      jsonb not null default '{}',
  speakers       jsonb not null default '{}',             -- {"waiter": {"name": "Camarero", "accessory": "none"}}
  lines          jsonb not null default '[]',             -- [{speaker, text, translations, choices?}]
  sort_order     int not null default 0
);

-- ---------------------------------------------------------------------
-- Learner data
-- ---------------------------------------------------------------------
create table public.lesson_progress (
  user_id       uuid not null references public.profiles on delete cascade,
  lesson_id     text not null references public.lessons on delete cascade,
  attempts      int not null default 0,
  best_score    int not null default 0,                   -- percent
  completed_at  timestamptz,
  primary key (user_id, lesson_id)
);

create table public.notebook_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles on delete cascade,
  language_code    text not null references public.languages on delete cascade,
  text             text not null check (char_length(text) between 1 and 200),
  translation      text not null check (char_length(translation) between 1 and 200),
  context_sentence text check (char_length(context_sentence) <= 500),
  note             text check (char_length(note) <= 500),
  created_at       timestamptz not null default now()
);
create index notebook_user_idx on public.notebook_entries (user_id, language_code, created_at desc);

-- One FSRS card per user per item (course word/phrase) or per notebook entry
create table public.review_cards (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles on delete cascade,
  language_code   text not null references public.languages on delete cascade,
  item_id         text references public.items on delete cascade,
  note_id         uuid references public.notebook_entries on delete cascade,
  due             timestamptz not null default now(),
  stability       double precision not null default 0,
  difficulty      double precision not null default 0,
  elapsed_days    int not null default 0,
  scheduled_days  int not null default 0,
  learning_steps  int not null default 0,
  reps            int not null default 0,
  lapses          int not null default 0,
  state           smallint not null default 0,            -- 0 new, 1 learning, 2 review, 3 relearning
  last_review     timestamptz,
  created_at      timestamptz not null default now(),
  check ((item_id is null) <> (note_id is null)),
  unique (user_id, item_id),
  unique (user_id, note_id)
);
create index review_cards_due_idx on public.review_cards (user_id, language_code, due);

create table public.review_log (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles on delete cascade,
  card_id      bigint not null references public.review_cards on delete cascade,
  rating       smallint not null,
  state        smallint not null,
  source       text not null default 'review',           -- review, lesson, practice
  reviewed_at  timestamptz not null default now()
);
create index review_log_user_idx on public.review_log (user_id, reviewed_at desc);

-- Words someone got wrong: feeds "practice your mistakes" and admin stats
create table public.mistakes (
  user_id      uuid not null references public.profiles on delete cascade,
  item_id      text not null references public.items on delete cascade,
  count        int not null default 1,
  last_at      timestamptz not null default now(),
  primary key (user_id, item_id)
);

create or replace function public.record_mistakes(p_wrong text[], p_right text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.mistakes (user_id, item_id)
  select auth.uid(), unnest(p_wrong)
  on conflict (user_id, item_id) do update set count = mistakes.count + 1, last_at = now();

  update public.mistakes set count = count - 1
  where user_id = auth.uid() and item_id = any(p_right);
  delete from public.mistakes where user_id = auth.uid() and count <= 0;
end;
$$;
grant execute on function public.record_mistakes(text[], text[]) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['sections','items','grammar_notes','culture_notes','lessons','phrase_packs','dialogues'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members read %1$s" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "admins write %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  foreach t in array array['lesson_progress','notebook_entries','review_cards','review_log','mistakes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own %1$s" on public.%1$I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "admins read %1$s" on public.%1$I for select to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Audio files for words, phrases and dialogue lines (public read, admin write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', true, 1048576, array['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'])
on conflict (id) do nothing;

create policy "admins upload audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'audio' and public.is_admin());
create policy "admins replace audio" on storage.objects for update to authenticated
  using (bucket_id = 'audio' and public.is_admin());
create policy "admins delete audio" on storage.objects for delete to authenticated
  using (bucket_id = 'audio' and public.is_admin());

update public.languages set tts_locale = 'es-ES' where code = 'es';
update public.languages set tts_locale = 'fi-FI' where code = 'fi';
update public.languages set tts_locale = 'fr-FR' where code = 'fr';
update public.languages set tts_locale = 'de-DE' where code = 'de';
update public.languages set tts_locale = 'it-IT' where code = 'la';  -- closest browser voice for Latin
