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

## Roadmap
- **Stage 1, part 1 (done):** accounts, invite codes, language + source selection, profiles, avatars, community.
- **Stage 1, next parts:** lessons, phrase packs, dialogues, spaced repetition (FSRS), notebook, reading, audio, journey map, XP/streaks/leaderboard, admin content editor, Spanish A1 + Finnish exam prep.
- **Stage 2 / 3:** duels, word map, French, German, Latin, AI conversation partner, Asian languages.
