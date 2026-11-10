import { AudioProvider } from "@/components/Speak";
import { requireEnrollment } from "@/lib/learn";

export default async function LearnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const { language } = await requireEnrollment(lang);
  return <AudioProvider locale={language.tts_locale ?? lang}>{children}</AudioProvider>;
}
