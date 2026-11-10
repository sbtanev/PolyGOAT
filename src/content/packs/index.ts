import type { LanguagePack } from "@/lib/packs/types";
import es from "./es.json";
import fi from "./fi.json";
import de from "./de.json";
import fr from "./fr.json";
import la from "./la.json";
import bg from "./bg.json";

/**
 * Language packs bundled with the site. To add a language:
 * 1. copy _template.json to <code>.json and fill it in,
 * 2. add one import line here,
 * 3. open Admin → Language packs and press "Import".
 */
export const BUNDLED_PACKS = [es, fi, de, fr, la, bg] as unknown as LanguagePack[];
