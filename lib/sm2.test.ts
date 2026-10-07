import { describe, expect, it } from "vitest";
import {
  assertGrade,
  INITIAL_STATE,
  reviewCard,
  type SM2State,
} from "./sm2";

const NOW = new Date("2026-01-01T00:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("reviewCard (SM-2)", () => {
  it("new card graded good -> 1 day interval, reps 1", () => {
    const r = reviewCard(INITIAL_STATE, "good", NOW);
    expect(r.repetitions).toBe(1);
    expect(r.interval).toBe(1);
    expect(r.nextReviewDate.getTime()).toBe(NOW.getTime() + DAY);
  });

  it("follows the classic 1 -> 6 -> EF progression on good", () => {
    const s1 = reviewCard(INITIAL_STATE, "good", NOW);
    const s2 = reviewCard(s1, "good", NOW);
    expect(s2.interval).toBe(6);
    const s3 = reviewCard(s2, "good", NOW);
    // interval 6 * EF(~2.7 after three goods) rounded
    expect(s3.interval).toBe(Math.round(6 * s3.easeFactor));
    expect(s3.repetitions).toBe(3);
  });

  it("again resets repetitions and schedules a same-day retry", () => {
    const matured: SM2State = { easeFactor: 2.5, interval: 30, repetitions: 5 };
    const r = reviewCard(matured, "again", NOW);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(0);
    expect(r.nextReviewDate.getTime()).toBeGreaterThan(NOW.getTime());
    expect(r.nextReviewDate.getTime() - NOW.getTime()).toBeLessThan(DAY);
  });

  it("hard grows the interval slowly and trims easiness", () => {
    const prev: SM2State = { easeFactor: 2.5, interval: 10, repetitions: 3 };
    const r = reviewCard(prev, "hard", NOW);
    expect(r.easeFactor).toBeLessThan(2.5);
    expect(r.interval).toBe(Math.round(10 * 1.2));
  });

  it("easy jumps ahead (4 days from new) and boosts easiness", () => {
    const r = reviewCard(INITIAL_STATE, "easy", NOW);
    expect(r.interval).toBe(4);
    expect(r.easeFactor).toBeGreaterThan(2.5);
  });

  it("never lets easeFactor drop below 1.3", () => {
    let s: SM2State = { easeFactor: 1.35, interval: 5, repetitions: 2 };
    for (let i = 0; i < 10; i++) s = reviewCard(s, "hard", NOW);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
    const failed = reviewCard(
      { easeFactor: 1.31, interval: 5, repetitions: 2 },
      "again",
      NOW
    );
    expect(failed.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("is deterministic for a fixed now (pure function)", () => {
    const a = reviewCard(INITIAL_STATE, "good", NOW);
    const b = reviewCard(INITIAL_STATE, "good", NOW);
    expect(a).toEqual(b);
  });

  it("assertGrade rejects unknown grades", () => {
    expect(() => assertGrade("medium")).toThrow();
    expect(assertGrade("easy")).toBe("easy");
  });
});
