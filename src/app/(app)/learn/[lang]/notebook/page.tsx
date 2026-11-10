import Link from "next/link";
import { SpeakButton } from "@/components/Speak";
import { addNotebookEntry, deleteNotebookEntry } from "../actions";
import { getDictionary } from "@/lib/i18n";
import { requireEnrollment } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";

type Entry = {
  id: string;
  text: string;
  translation: string;
  context_sentence: string | null;
  note: string | null;
  created_at: string;
};

export default async function NotebookPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { profile } = await requireEnrollment(lang);
  const { t } = await getDictionary();

  const supabase = await createClient();
  const { data } = await supabase
    .from("notebook_entries")
    .select("*")
    .eq("user_id", profile.id)
    .eq("language_code", lang)
    .order("created_at", { ascending: false });
  const entries = (data ?? []) as Entry[];

  const add = addNotebookEntry.bind(null, lang);
  const remove = deleteNotebookEntry.bind(null, lang);

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/learn/${lang}`} className="text-sm text-muted hover:text-ink">
        ← {t.learn.back}
      </Link>
      <header>
        <h1 className="font-display text-xl font-bold sm:text-2xl">📓 {t.learn.notebook}</h1>
        <p className="mt-1 text-sm text-muted">{t.notebook.intro}</p>
      </header>

      <form action={add} className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="text">
            {t.notebook.word}
          </label>
          <input id="text" name="text" required maxLength={200} className="input" autoCapitalize="none" />
        </div>
        <div>
          <label className="label" htmlFor="translation">
            {t.notebook.translation}
          </label>
          <input id="translation" name="translation" required maxLength={200} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="context_sentence">
            {t.notebook.sentence}
          </label>
          <input id="context_sentence" name="context_sentence" maxLength={500} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="note">
            {t.notebook.note}
          </label>
          <input id="note" name="note" maxLength={500} className="input" />
        </div>
        <button className="btn-primary sm:col-span-2 sm:justify-self-start">+ {t.notebook.add}</button>
      </form>

      {entries.length === 0 ? (
        <p className="card text-muted">{t.notebook.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.id} className="card flex items-start gap-3 p-4 sm:p-4">
              <SpeakButton text={e.text} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {e.text} <span className="font-normal text-muted">· {e.translation}</span>
                </p>
                {e.context_sentence && <p className="text-sm italic text-muted">“{e.context_sentence}”</p>}
                {e.note && <p className="text-sm text-muted">💡 {e.note}</p>}
              </div>
              <form action={remove}>
                <input type="hidden" name="id" value={e.id} />
                <button className="text-sm text-coral hover:underline" aria-label={t.notebook.delete}>
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
