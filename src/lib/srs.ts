import "server-only";
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";

export const scheduler = fsrs({ enable_fuzz: true });
export { Rating };

export type CardRow = {
  id: number;
  user_id: string;
  language_code: string;
  item_id: string | null;
  note_id: string | null;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
};

export function rowToCard(r: CardRow): Card {
  return {
    due: new Date(r.due),
    stability: r.stability,
    difficulty: r.difficulty,
    elapsed_days: r.elapsed_days,
    scheduled_days: r.scheduled_days,
    learning_steps: r.learning_steps,
    reps: r.reps,
    lapses: r.lapses,
    state: r.state,
    last_review: r.last_review ? new Date(r.last_review) : undefined,
  };
}

export function cardToRow(c: Card) {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.toISOString() : null,
  };
}

/** A brand-new card, optionally already graded once (e.g. right after a lesson). */
export function newCard(firstGrade?: Grade) {
  const now = new Date();
  const empty = createEmptyCard(now);
  return firstGrade ? scheduler.next(empty, now, firstGrade).card : empty;
}
