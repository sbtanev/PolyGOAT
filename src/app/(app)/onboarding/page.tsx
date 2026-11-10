import type { Metadata } from "next";
import { LanguagePicker } from "./LanguagePicker";
import { getDictionary, pickName } from "@/lib/i18n";
import { getBaseLanguages, getLanguages, getUserLanguages, requireProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Add a language" };

export default async function OnboardingPage() {
  const profile = await requireProfile();
  const { t, locale } = await getDictionary();
  const [languages, bases, mine] = await Promise.all([
    getLanguages(),
    getBaseLanguages(),
    getUserLanguages(profile.id),
  ]);
  const learning = new Set(mine.map((m) => m.language_code));

  const targets = languages.map((l) => ({
    code: l.code,
    label: pickName(l.name, locale),
    flag: l.flag,
    accessory: l.mascot_accessory,
    disabled: !l.is_active || learning.has(l.code),
    note: !l.is_active ? t.onboarding.soon : learning.has(l.code) ? t.onboarding.alreadyLearning : undefined,
  }));
  const sources = bases.map((b) => ({ code: b.code, label: pickName(b.name, locale), flag: b.flag }));
  const nothingLeft = targets.every((x) => x.disabled);

  return (
    <div className="card">
      <h1 className="mb-6 font-display text-xl font-bold sm:text-2xl">{t.onboarding.title}</h1>
      {nothingLeft ? (
        <p className="text-muted">{t.onboarding.allAdded}</p>
      ) : (
        <LanguagePicker
          targets={targets}
          sources={sources}
          labels={{ step1: t.onboarding.step1, step2: t.onboarding.step2, start: t.onboarding.start }}
        />
      )}
    </div>
  );
}
