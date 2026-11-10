# PolyGOAT 🐐

A small, friendly language-learning site for a group of friends, focused on real conversations.
**Poly**glot + **GOAT** (Greatest Of All Time) + a goat mascot that climbs your journey map.

- **Setup guide (Bulgarian):** [docs/SETUP.bg.md](docs/SETUP.bg.md)
- **Project brief:** the full feature list lives in the Claude project "Languages".

## Stack
- Next.js (App Router) on Vercel
- Supabase: Postgres, Auth, Storage, Realtime
- Tailwind CSS v4, self-hosted fonts (Unbounded + Nunito)

## Structure
| Path | What |
|---|---|
| `src/app/(auth)` | Sign in, sign up with invite code |
| `src/app/(app)` | Logged-in area: home, onboarding, profile, community, admin |
| `src/lib/i18n` | Interface texts (`en.ts`, `bg.ts`) |
| `src/components/Goat.tsx` | The mascot, with per-language accessories |
| `supabase/migrations` | SQL to run in the Supabase SQL editor, in order |

## Local development
```bash
cp .env.example .env.local   # fill in the two Supabase values
npm install
npm run dev
```

## What's in Stage 1
- Accounts with invite codes, profiles with avatars, community, public profiles
- Lessons (auto-generated + hand-written exercises), practice-your-mistakes, phrase packs with native/slang versions, dialogues
- Spaced repetition (FSRS), personal notebook, click-to-translate reading
- Journey map per language (places unlock with lessons)
- XP, streaks with a weekly freeze, weekly leaderboard, GOAT of the week
- Admin: invite codes, pack import/export, content editor, users, statistics
- Content: Spanish A1 and Finnish exam prep, translated into BG/EN/DE/FR(/ES)
- Audio: recorded MP3s via `scripts/generate-audio.mjs` (GitHub Action "Generate audio"), browser voice as fallback

## Next
- **Stage 2:** duels, word map, etymologies, false friends, dictation & shadowing, graded/parallel texts, own-text import, French, German, Latin, badges and cosmetics, activity feed.
- **Stage 3:** AI conversation partner, speech recognition, level tests, offline mode, Anki export, Asian languages.
