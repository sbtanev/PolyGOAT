// Checks every language pack for broken references and missing translations.
// Usage: npm run validate-packs        (exit code 1 if anything is wrong)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validatePack } from "../src/lib/packs/validate";
import type { LanguagePack } from "../src/lib/packs/types";

const BASES = ["en", "bg", "de", "fr", "es"];
const dir = join(process.cwd(), "src/content/packs");
let failed = false;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_"))) {
  const pack = JSON.parse(readFileSync(join(dir, file), "utf8")) as LanguagePack;
  const code = pack.language.code;
  const errors = validatePack(pack);
  const langs = BASES.filter((b) => b !== code);
  for (const item of pack.items) {
    const missing = langs.filter((l) => !item.translations[l]);
    if (missing.length) errors.push(`item ${item.id} has no translation for: ${missing.join(", ")}`);
  }
  const texts = new Map<string, string>();
  for (const item of pack.items) {
    const key = item.text.toLowerCase();
    if (texts.has(key)) errors.push(`duplicate text "${item.text}" in ${texts.get(key)} and ${item.id}`);
    texts.set(key, item.id);
  }
  const index = readFileSync(join(dir, "index.ts"), "utf8");
  if (!index.includes(`./${file}`)) errors.push(`${file} is not registered in src/content/packs/index.ts`);

  if (errors.length) {
    failed = true;
    console.error(`✗ ${file} (v${pack.version})`);
    for (const e of errors) console.error(`   - ${e}`);
  } else {
    console.log(`✓ ${file} v${pack.version}: ${pack.items.length} items, ${pack.lessons.length} lessons, ${pack.places?.length ?? 0} places`);
  }
}
process.exit(failed ? 1 : 0);
