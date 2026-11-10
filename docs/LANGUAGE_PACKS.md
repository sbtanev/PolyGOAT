# Adding a language to PolyGOAT

Every language is one **pack**: a JSON file in `src/content/packs/`. No code changes are needed apart from one import line.

## Steps
1. Copy `src/content/packs/_template.json` to `src/content/packs/<code>.json` (e.g. `ja.json`).
2. Fill it in (see the field guide below). Ask Claude to draft content if you like.
3. Add one line to `src/content/packs/index.ts`:
   ```ts
   import ja from "./ja.json";
   export const BUNDLED_PACKS: LanguagePack[] = [es as LanguagePack, ja as LanguagePack];
   ```
4. After the site redeploys: **Admin → Language packs → Import**. The page lists any mistakes in the pack (unknown ids, missing translations…) before importing.

Re-importing a pack updates the content. Nothing is deleted, so learners keep their progress.

## Field guide
| Field | Meaning |
|---|---|
| `version` | Bump it when you change the pack, so the admin page shows that an update is available. |
| `language.code` | Short code (`es`, `fi`, `ja`). Prefix every id in the pack with it (`ja-neko`). |
| `language.ttsLocale` | Browser voice locale used when there is no recorded audio (`ja-JP`). |
| `language.mascotAccessory` | The goat's hat: `sombrero`, `beret`, `beanie`, `alpine`, `laurel`, `crown`, `headphones` or `none`. |
| `language.varieties` | Regional varieties used in `slang` (`es-MX`, `es-AR`…). |
| `sections` | Themed sections ("History", "Medicine"…). `unlockAfterLevel` keeps them closed until a level. `core` always exists. |
| `items` | Words, phrases and sentences. Everything that can go into review. |
| `items[].translations` | One key per base language: `bg`, `en`, `fr`, `de`, `es`. English is required; others fall back to English. |
| `items[].translationStatus` | `verified` or `auto` per language, so machine translations can be checked later. |
| `items[].native` / `slang` | "How a native would say it" and regional slang. |
| `items[].extras` | Anything script-specific: `{"reading": "ねこ", "romaji": "neko"}`, `{"pinyin": "māo"}`, cases, tones… |
| `lessons[].items` | Item ids taught in the lesson. The site generates the exercises automatically. |
| `lessons[].exercises` | Extra hand-written exercises: `fill_blank` (prompt with `___`), `order_words`, `choose`. |
| `phrasePacks` | Situational phrase lists ("At the airport"). |
| `dialogues` | Conversations. A line with `choices` is the learner's turn; exactly one choice should be `correct`. |

## Adding a sixth base language
Base languages live in the `base_languages` table. Add a row in Supabase (Table editor → base_languages → Insert), then add that language's key to the `translations` in the packs. Missing translations fall back to English.
