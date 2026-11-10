import type { LanguagePack } from "./types";

/** Catches the mistakes that are easy to make when editing a pack by hand. */
export function validatePack(pack: LanguagePack): string[] {
  const errors: string[] = [];
  const code = pack.language?.code;
  if (!code) return ["language.code is missing"];

  const itemIds = new Set<string>();
  for (const item of pack.items ?? []) {
    if (!item.id || !item.text) errors.push(`item without id or text: ${JSON.stringify(item).slice(0, 80)}`);
    if (itemIds.has(item.id)) errors.push(`duplicate item id: ${item.id}`);
    itemIds.add(item.id);
    if (!item.translations?.en) errors.push(`item ${item.id} has no English translation`);
  }

  const grammarIds = new Set((pack.grammarNotes ?? []).map((g) => g.id));
  const sectionSlugs = new Set(["core", ...(pack.sections ?? []).map((s) => s.slug)]);
  const ids = new Set<string>();

  const checkRefs = (owner: string, refs: string[] | undefined) => {
    for (const ref of refs ?? []) if (!itemIds.has(ref)) errors.push(`${owner} uses unknown item ${ref}`);
  };

  for (const lesson of pack.lessons ?? []) {
    if (ids.has(lesson.id)) errors.push(`duplicate id: ${lesson.id}`);
    ids.add(lesson.id);
    if (lesson.section && !sectionSlugs.has(lesson.section))
      errors.push(`lesson ${lesson.id} uses unknown section ${lesson.section}`);
    checkRefs(`lesson ${lesson.id}`, lesson.items);
    for (const g of lesson.grammar ?? [])
      if (!grammarIds.has(g)) errors.push(`lesson ${lesson.id} uses unknown grammar note ${g}`);
    for (const ex of lesson.exercises ?? []) {
      if ("itemId" in ex && ex.itemId && !itemIds.has(ex.itemId))
        errors.push(`lesson ${lesson.id} exercise uses unknown item ${ex.itemId}`);
      if (ex.type === "choose" && !ex.options.includes(ex.answer))
        errors.push(`lesson ${lesson.id}: answer "${ex.answer}" is not among the options`);
      if (ex.type === "fill_blank" && !ex.prompt.includes("___"))
        errors.push(`lesson ${lesson.id}: fill_blank prompt needs ___`);
    }
  }
  for (const pp of pack.phrasePacks ?? []) {
    if (ids.has(pp.id)) errors.push(`duplicate id: ${pp.id}`);
    ids.add(pp.id);
    checkRefs(`phrase pack ${pp.id}`, pp.items);
  }
  for (const d of pack.dialogues ?? []) {
    if (ids.has(d.id)) errors.push(`duplicate id: ${d.id}`);
    ids.add(d.id);
    for (const line of d.lines) {
      if (!d.speakers[line.speaker]) errors.push(`dialogue ${d.id} uses unknown speaker ${line.speaker}`);
      if (line.choices && !line.choices.some((c) => c.correct))
        errors.push(`dialogue ${d.id}: a choice line has no correct answer`);
    }
  }
  return errors;
}
