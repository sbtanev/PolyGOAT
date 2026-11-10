/**
 * Language pack format. One JSON file per language in src/content/packs/.
 * See docs/LANGUAGE_PACKS.md for a guide and src/content/packs/_template.json.
 *
 * Every translatable text is a `Tr`: an object keyed by base language code.
 * Missing keys fall back to English, so a pack can start with only "en" + "bg".
 */
export type Tr = Partial<Record<string, string>>;
export type TrStatus = Partial<Record<string, "verified" | "auto">>;

export type PackItem = {
  id: string;                 // "es-noche": unique across all packs, prefix with the language code
  text: string;               // as learners should write it, nouns with their article ("la noche")
  kind?: "word" | "phrase" | "sentence";
  translations: Tr;
  translationStatus?: TrStatus;
  pos?: string;
  gender?: string;
  frequencyRank?: number;
  native?: string;            // natural colloquial version
  slang?: Record<string, string>; // per variety: {"es-MX": "..."}
  notes?: Tr;
  extras?: Record<string, unknown>; // script-specific data (pinyin, furigana, cases...)
  audio?: string;             // URL of a recorded file, optional
};

export type AuthoredExercise =
  | {
      type: "fill_blank";     // "Minä ___ Suomessa." → asun
      prompt: string;
      answer: string;
      alternatives?: string[];
      options?: string[];     // if present: multiple choice, otherwise typed
      hint?: Tr;
      explanation?: Tr;
      itemId?: string;
    }
  | {
      type: "order_words";    // arrange the words into the sentence
      sentence: string;
      translation: Tr;
      itemId?: string;
    }
  | {
      type: "choose";         // free multiple choice question
      prompt: Tr;
      target?: string;
      options: string[];
      answer: string;
      explanation?: Tr;
      itemId?: string;
    };

export type PackLesson = {
  id: string;
  section?: string;           // section slug, default "core"
  level?: string;
  title: Tr;
  description?: Tr;
  items: string[];            // item ids taught in this lesson
  grammar?: string[];         // grammar note ids shown before the exercises
  exercises?: AuthoredExercise[];
};

export type DialogueLine = {
  speaker: string;
  text: string;
  translations: Tr;
  /** If present, the learner picks this line from the choices. */
  choices?: { text: string; translations: Tr; correct: boolean; feedback?: Tr }[];
};

export type LanguagePack = {
  version: string;
  language: {
    code: string;
    name: Tr;
    nativeName: string;
    flag: string;
    script?: string;
    features?: string[];
    mascotAccessory?: string;
    varieties?: string[];
    ttsLocale?: string;
    active?: boolean;
    /** Journey map view: [[west, south], [east, north]] in degrees */
    mapBounds?: [[number, number], [number, number]];
  };
  sections?: { slug: string; title: Tr; description?: Tr; unlockAfterLevel?: string }[];
  items: PackItem[];
  grammarNotes?: { id: string; level?: string; title: Tr; body: Tr }[];
  cultureNotes?: { id: string; title: Tr; body: Tr }[];
  lessons: PackLesson[];
  phrasePacks?: { id: string; level?: string; icon?: string; title: Tr; description?: Tr; items: string[] }[];
  dialogues?: {
    id: string;
    level?: string;
    icon?: string;
    title: Tr;
    situation?: Tr;
    speakers: Record<string, { name: string; accessory?: string }>;
    lines: DialogueLine[];
  }[];
  readings?: PackReading[];
  places?: PackPlace[];
};

export type PackReading = {
  id: string;
  section?: string;
  level?: string;
  title: Tr;
  sentences: { text: string; translations: Tr }[];
  /** Clickable words. Key = word as it appears (lowercase). Link to an item to allow "add to review". */
  glossary?: Record<string, { item?: string; translations?: Tr }>;
};

export type PackPlace = {
  id: string;
  section?: string;
  name: string;
  country?: string;
  lat: number;
  lng: number;
  description?: Tr;
  unlockAfterLesson?: string; // lesson id; empty = open from the start
  localItems?: string[];
  cultureNote?: string;
  reading?: string;
};
