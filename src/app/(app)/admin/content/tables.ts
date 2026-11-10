export const EDITABLE_TABLES = [
  "lessons",
  "phrase_packs",
  "dialogues",
  "readings",
  "map_places",
  "grammar_notes",
  "culture_notes",
  "sections",
] as const;
export type EditableTable = (typeof EDITABLE_TABLES)[number];
export type SaveState = { ok?: boolean; error?: string } | undefined;
