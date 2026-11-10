// Generates an MP3 for every word/phrase of a language that has no audio yet,
// using Google Cloud Text-to-Speech (free tier), uploads it to Supabase Storage
// and saves the link on the item.
//
// Usage:  node scripts/generate-audio.mjs es        (or: fi, all)
// Needs these environment variables (GitHub → Settings → Secrets → Actions):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_TTS_API_KEY
// Optional: TTS_LIMIT (max items per run, default 300), TTS_OVERWRITE=1

import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_TTS_API_KEY } = process.env;
const LIMIT = Number(process.env.TTS_LIMIT ?? 300);
const OVERWRITE = process.env.TTS_OVERWRITE === "1";
const target = process.argv[2] ?? "all";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_TTS_API_KEY) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or GOOGLE_TTS_API_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Text the voice should read: drop "…" placeholders and slashes between alternatives
const speakable = (text) => text.replace(/…/g, "").split(" / ")[0].trim();

async function synthesize(text, locale) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: locale },
      audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const { audioContent } = await res.json();
  return Buffer.from(audioContent, "base64");
}

const { data: languages, error: langErr } = await supabase.from("languages").select("code, tts_locale");
if (langErr) throw langErr;
const chosen = languages.filter((l) => (target === "all" || l.code === target) && l.tts_locale);

let done = 0;
for (const lang of chosen) {
  let query = supabase.from("items").select("id, text").eq("language_code", lang.code);
  if (!OVERWRITE) query = query.is("audio_url", null);
  const { data: items, error } = await query.limit(LIMIT - done);
  if (error) throw error;
  console.log(`${lang.code}: ${items.length} items without audio`);

  for (const item of items) {
    try {
      const mp3 = await synthesize(speakable(item.text), lang.tts_locale);
      const path = `${lang.code}/${item.id}.mp3`;
      const { error: upErr } = await supabase.storage.from("audio").upload(path, mp3, { contentType: "audio/mpeg", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("audio").getPublicUrl(path);
      await supabase.from("items").update({ audio_url: data.publicUrl }).eq("id", item.id);
      done++;
      console.log(`  ✓ ${item.text}`);
    } catch (e) {
      console.error(`  ✗ ${item.text}: ${e.message}`);
    }
    if (done >= LIMIT) break;
  }
}
console.log(`Done: ${done} audio files.`);
