import type { Metadata } from "next";
import Link from "next/link";
import { ItemEditor, JsonEditor } from "./editors";
import type { EditableTable } from "./tables";
import { getDictionary, pickName } from "@/lib/i18n";
import { getBaseLanguages, getLanguages, requireProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { tr } from "@/lib/tr";

export const metadata: Metadata = { title: "Content" };

type Tab = "items" | EditableTable;

const NEW_ROW: Record<EditableTable, Record<string, unknown>> = {
  lessons: { id: "xx-a1-99", section_id: "xx-core", level: "A1", title: { en: "", bg: "" }, description: {}, item_ids: [], grammar_ids: [], exercises: [], sort_order: 99 },
  phrase_packs: { id: "xx-pp-new", level: "A1", icon: "💬", title: { en: "", bg: "" }, description: {}, item_ids: [], sort_order: 99 },
  dialogues: { id: "xx-d-new", level: "A1", icon: "🗨️", title: { en: "" }, situation: {}, speakers: { a: { name: "A" }, you: { name: "You" } }, lines: [], sort_order: 99 },
  readings: { id: "xx-r-new", section_id: "xx-core", level: "A1", title: { en: "" }, sentences: [{ text: "", translations: { en: "" } }], glossary: {}, sort_order: 99 },
  map_places: { id: "xx-p-new", name: "", country: "", lat: 0, lng: 0, description: { en: "" }, unlock_after_lesson: null, local_item_ids: [], culture_note_id: null, reading_id: null, sort_order: 99 },
  grammar_notes: { id: "xx-g-new", level: "A1", title: { en: "" }, body: { en: "" }, sort_order: 99 },
  culture_notes: { id: "xx-c-new", title: { en: "" }, body: { en: "" }, sort_order: 99 },
  sections: { id: "xx-new", slug: "new", title: { en: "" }, description: {}, unlock_after_level: null, sort_order: 99 },
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; tab?: string; q?: string; auto?: string }>;
}) {
  const profile = await requireProfile();
  const { t, locale } = await getDictionary();
  if (profile.role !== "admin") return <p className="card text-muted">{t.admin.onlyAdmins}</p>;

  const sp = await searchParams;
  const languages = await getLanguages();
  const lang = sp.lang ?? languages.find((l) => l.is_active)?.code ?? "es";
  const tab = (sp.tab ?? "items") as Tab;
  const q = (sp.q ?? "").trim().toLowerCase();
  const autoOnly = sp.auto === "1";
  const bases = await getBaseLanguages();
  const supabase = await createClient();
  const a = t.adminContent;
  const labels = { save: a.save, saved: a.saved, delete: a.delete, confirmDelete: a.confirmDelete, status: a.status, verified: a.verified, auto: a.auto };

  const tabs: [Tab, string][] = [
    ["items", a.words],
    ["lessons", a.lessons],
    ["phrase_packs", a.phrasePacks],
    ["dialogues", a.dialogues],
    ["readings", a.readings],
    ["map_places", a.places],
    ["grammar_notes", a.grammar],
    ["culture_notes", a.culture],
  ];
  const href = (over: Record<string, string>) => {
    const params = new URLSearchParams({ lang, tab, ...(q ? { q } : {}), ...(autoOnly ? { auto: "1" } : {}), ...over });
    return `/admin/content?${params}`;
  };

  let rows: Record<string, unknown>[] = [];
  if (tab === "items") {
    const { data } = await supabase.from("items").select("*").eq("language_code", lang).order("frequency_rank", { nullsFirst: false }).order("id");
    rows = (data ?? []).filter((r) => {
      if (q && !String(r.text).toLowerCase().includes(q) && !String(r.id).includes(q) && !JSON.stringify(r.translations).toLowerCase().includes(q)) return false;
      if (autoOnly) {
        const st = (r.translation_status ?? {}) as Record<string, string>;
        return bases.some((b) => b.code !== lang && st[b.code] !== "verified");
      }
      return true;
    });
  } else {
    const { data } = await supabase.from(tab).select("*").eq("language_code", lang).order("sort_order");
    rows = (data ?? []).filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold sm:text-2xl">✏️ {a.content}</h1>
        <a href={`/admin-export/${lang}`} className="btn-ghost" download>
          ⬇️ {a.export}
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {languages.map((l) => (
          <Link key={l.code} href={`/admin/content?lang=${l.code}&tab=${tab}`} className={`chip min-h-9 px-3 text-sm ${l.code === lang ? "border-gold text-gold" : ""}`}>
            {l.flag} {pickName(l.name, locale)}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Link key={key} href={href({ tab: key })} className={`chip min-h-9 px-3 text-sm ${key === tab ? "border-mint text-mint" : ""}`}>
            {label}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="tab" value={tab} />
        <input name="q" defaultValue={q} placeholder={a.search} className="input flex-1" />
        {tab === "items" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="auto" value="1" defaultChecked={autoOnly} /> {a.autoOnly}
          </label>
        )}
        <button className="btn-ghost">🔎</button>
      </form>
      <p className="text-xs text-muted">{rows.length} · {tab !== "items" && a.jsonHint}</p>

      <details className="card border-dashed">
        <summary className="cursor-pointer font-bold">+ {a.newItem}</summary>
        <div className="mt-4">
          {tab === "items" ? (
            <ItemEditor
              item={{ id: "", text: "", kind: "word", native: null, translations: {}, translation_status: {} }}
              lang={lang}
              baseLanguages={bases}
              labels={labels}
            />
          ) : (
            <JsonEditor
              table={tab}
              lang={lang}
              row={JSON.parse(JSON.stringify(NEW_ROW[tab]).replaceAll('"xx-', `"${lang}-`))}
              labels={labels}
            />
          )}
        </div>
      </details>

      <ul className="flex flex-col gap-2">
        {rows.slice(0, 200).map((r) => {
          const id = String(r.id);
          const label =
            tab === "items"
              ? `${r.text} · ${tr(r.translations as Record<string, string>, "en")}`
              : tab === "map_places"
                ? String(r.name)
                : tr(r.title as Record<string, string>, locale) || id;
          const status = (r.translation_status ?? {}) as Record<string, string>;
          const unverified = tab === "items" && bases.some((b) => b.code !== lang && status[b.code] !== "verified");
          return (
            <li key={id}>
              <details className="card p-4 sm:p-4">
                <summary className="cursor-pointer">
                  <span className="font-bold">{label}</span>{" "}
                  <span className="font-mono text-xs text-muted">{id}</span>
                  {unverified && <span className="ml-2 text-xs">🤖</span>}
                </summary>
                <div className="mt-4">
                  {tab === "items" ? (
                    <ItemEditor
                      item={r as Parameters<typeof ItemEditor>[0]["item"]}
                      lang={lang}
                      baseLanguages={bases}
                      labels={labels}
                    />
                  ) : (
                    <JsonEditor table={tab} lang={lang} row={r} labels={labels} />
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
