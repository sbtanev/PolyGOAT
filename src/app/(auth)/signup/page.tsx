import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { SignupForm } from "./SignupForm";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = { title: "Join" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { t, locale } = await getDictionary();
  const { code } = await searchParams;
  return (
    <AuthShell title={t.auth.signupTitle} locale={locale} accessory="sombrero">
      <SignupForm t={t.auth} code={code ?? ""} />
    </AuthShell>
  );
}
