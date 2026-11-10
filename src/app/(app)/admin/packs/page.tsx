import type { Metadata } from "next";
import { ImportButton } from "./ImportButton";
import { BUNDLED_PACKS } from "@/content/packs";
import { validatePack } from "@/lib/packs/validate";
import { getDictionary, pickName } from "@/lib/i18n";
import { getLanguages, requireProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Language packs" };

export default async function PacksPage() {
  const profile = await requireProfile();
  const { t, locale } = await getDictionary();
  if (profile.role !== "admin") return <p className="card text-muted">{t.admin.onlyAdmins}</p>;
  const languages = await getLanguages();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">{t.packs.title}</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">{t.packs.intro}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {BUNDLED_PACKS.map((pack) => {
          const inDb = languages.find((l) => l.code === pack.language.code);
          const dbVersion = (inDb as { pack_version?: string } | undefined)?.pack_version;
          const errors = validatePack(pack);
          return (
            <li key={pack.language.code} className="card flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-bold">
                  {pack.language.flag} {pickName(pack.language.name as Record<string, string>, locale)}
                </p>
                <p className="text-sm text-muted">
                  {t.packs.bundled}: <span className="font-mono">{pack.version}</span> · {t.packs.inDb}:{" "}
                  <span className="font-mono">{dbVersion ?? t.packs.notImported}</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {pack.items.length} items · {pack.lessons.length} lessons · {pack.phrasePacks?.length ?? 0} phrase
                  packs · {pack.dialogues?.length ?? 0} dialogues
                </p>
                {errors.length > 0 && (
                  <div className="mt-3 text-sm text-coral">
                    <p className="font-bold">{t.packs.invalid}</p>
                    <ul className="list-disc pl-5">
                      {errors.slice(0, 10).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {errors.length === 0 && (
                <ImportButton
                  code={pack.language.code}
                  label={dbVersion ? t.packs.update : t.packs.import}
                  pendingLabel={t.packs.importing}
                  doneLabel={t.packs.imported}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
