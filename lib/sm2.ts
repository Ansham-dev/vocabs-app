// SM-2 spaced-repetition engine (SuperMemo-2, adapted for day granularity).
//
// Pure function: no DB, no Date.now() inside (caller passes `now`), so it is
// trivially unit-testable. Used by POST /api/review.

export type RecallGrade = "again" | "hard" | "good" | "easy";

export const GRADES: RecallGrade[] = ["again", "hard", "good", "easy"];

export interface SM2State {
  /** Easiness factor, >= 1.3. New cards start at 2.5. */
  easeFactor: number;
  /** Current interval in days. */
  interval: number;
  /** Consecutive successful recalls. */
  repetitions: number;
}

export interface SM2Result extends SM2State {
  nextReviewDate: Date;
}

export const INITIAL_STATE: SM2State = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;
const AGAIN_DELAY_MS = 10 * 60 * 1000; // failed cards come back in ~10 minutes

function isGrade(g: unknown): g is RecallGrade {
  return g === "again" || g === "hard" || g === "good" || g === "easy";
}

export function assertGrade(g: unknown): RecallGrade {
  if (!isGrade(g)) throw new Error(`Invalid grade: ${JSON.stringify(g)}`);
  return g;
}

// SM-2 quality mapping: again = total blackout (0), hard = 3, good = 4, easy = 5.
function qualityOf(grade: RecallGrade): number {
  switch (grade) {
    case "again":
      return 0;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}

function clampState(s: SM2State): SM2State {
  return {
    easeFactor: Number.isFinite(s.easeFactor)
      ? Math.max(MIN_EASE, s.easeFactor)
      : 2.5,
    interval: Number.isFinite(s.interval) ? Math.max(0, Math.round(s.interval)) : 0,
    repetitions: Number.isFinite(s.repetitions)
      ? Math.max(0, Math.round(s.repetitions))
      : 0,
  };
}

/**
 * Advance one card's SM-2 state given the user's recall grade.
 *
 * - again: reset repetitions, ease penalty, review again in ~10 minutes.
 * - hard: small ease penalty, interval grows x1.2 (min 1 day).
 * - good: classic SM-2 progression 1 -> 6 -> interval*EF.
 * - easy: ease bonus, skips ahead (4 days first, then interval*EF*1.3).
 */
export function reviewCard(
  prev: SM2State,
  grade: RecallGrade,
  now: Date = new Date()
): SM2Result {
  const s = clampState(prev);
  const q = qualityOf(grade);
  const nowMs = now.getTime();

  if (grade === "again") {
    // Reset progress. Textbook SM-2 with q=0 would cut EF by 0.8, which craters
    // a card after a single lapse — softened to -0.2 so one failure stings
    // without destroying months of progress.
    const easeFactor = Math.max(MIN_EASE, s.easeFactor - 0.2);
    return {
      easeFactor: round2(easeFactor),
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date(nowMs + AGAIN_DELAY_MS),
    };
  }

  // Standard SM-2 easiness update for q >= 3.
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const easeFactor = round2(Math.max(MIN_EASE, s.easeFactor + efDelta));
  const repetitions = s.repetitions + 1;

  let interval: number;
  if (grade === "hard") {
    interval = s.interval <= 0 ? 1 : Math.max(1, Math.round(s.interval * 1.2));
  } else if (grade === "easy") {
    interval =
      s.interval <= 0 ? 4 : Math.max(1, Math.round(s.interval * easeFactor * 1.3));
  } else {
    // good: 0->1, 1->6, else interval * EF
    if (s.interval <= 0) interval = 1;
    else if (s.interval === 1) interval = 6;
    else interval = Math.max(1, Math.round(s.interval * easeFactor));
  }

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: new Date(nowMs + interval * DAY_MS),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
