import type { LanguagePack } from "@/lib/packs/types";
import es from "./es.json";

/**
 * Language packs bundled with the site. To add a language:
 * 1. copy _template.json to <code>.json and fill it in,
 * 2. add one import line here,
 * 3. open Admin → Language packs and press "Import".
 */
export const BUNDLED_PACKS: LanguagePack[] = [es as LanguagePack];
