"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import DeckPicker, {
  type DifficultyFilter,
  type LanguageFilter,
} from "./components/DeckPicker";
import Flashcard from "./components/Flashcard";
import Heatmap from "./components/Heatmap";
import type { DayCount, DeckInfo, DueCard, SessionUser } from "./components/types";

type Grade = "again" | "hard" | "good" | "easy";

// Server /api/* errors carry a human `hint` — surface it instead of a dead end.
async function decksErrorMessage(e: unknown): Promise<string> {
  const fallback =
    "Could not load decks. The database may be waking up — wait a few seconds and retry.";
  if (e instanceof Response) {
    try {
      const d = (await e.json()) as { error?: string; hint?: string };
      if (d?.hint) return `${d.error ?? "Could not load decks."} ${d.hint}`;
    } catch {
      /* fall through */
    }
  }
  return fallback;
}

const GRADE_BUTTONS: { grade: Grade; label: string; hint: string; cls: string }[] = [
  { grade: "again", label: "Again", hint: "1", cls: "bg-red-600 hover:bg-red-700" },
  { grade: "hard", label: "Hard", hint: "2", cls: "bg-orange-500 hover:bg-orange-600" },
  { grade: "good", label: "Good", hint: "3", cls: "bg-green-600 hover:bg-green-700" },
  { grade: "easy", label: "Easy", hint: "4", cls: "bg-blue-600 hover:bg-blue-700" },
];

export default function Home() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [decksError, setDecksError] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const [queue, setQueue] = useState<DueCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [grading, setGrading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<DayCount[]>([]);

  const refreshDecks = useCallback(async () => {
    try {
      const res = await fetch("/api/decks");
      if (!res.ok) throw res;
      const data = await res.json();
      setDecks(data.decks);
      setDecksError(null);
    } catch (e) {
      setDecksError(await decksErrorMessage(e));
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const data = await res.json();
      setStreak(data.streak);
      setDays(data.reviewsByDay);
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    // Initial/session-change load. State updates happen in fetch callbacks
    // (not synchronously in the effect body) with a cancellation guard.
    let cancelled = false;

    fetch("/api/decks")
      .then(async (res) => {
        if (!res.ok) throw res;
        const data = await res.json();
        if (!cancelled) {
          setDecks(data.decks);
          setDecksError(null);
        }
      })
      .catch(async (e) => {
        if (!cancelled) {
          setDecksError(await decksErrorMessage(e));
        }
      });

    if (user) {
      fetch("/api/stats")
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          if (!cancelled) {
            setStreak(data.streak);
            setDays(data.reviewsByDay);
          }
        })
        .catch(() => {
          /* stats are non-critical */
        });
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  const startReview = useCallback(
    async (deckId: string) => {
      if (!user) {
        setReviewError("Log in above to start a review session.");
        return;
      }
      setSelectedDeckId(deckId);
      setLoadingQueue(true);
      setReviewError(null);
      setSessionDone(false);
      try {
        const res = await fetch(
          `/api/review/due?deckId=${deckId}&limit=20`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load cards.");
        setQueue(data.cards);
        setSessionTotal(data.cards.length);
        setIndex(0);
        setRevealed(false);
      } catch (e) {
        setReviewError(e instanceof Error ? e.message : "Failed to load cards.");
        setQueue([]);
      } finally {
        setLoadingQueue(false);
      }
    },
    [user]
  );

  const grade = useCallback(
    async (g: Grade) => {
      const card = queue[index];
      if (!card || grading) return;
      setGrading(true);
      setReviewError(null);
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: card._id, grade: g }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to save review.");
        }
        if (index + 1 >= queue.length) {
          setSessionDone(true);
          refreshDecks();
          refreshStats();
        } else {
          setIndex(index + 1);
          setRevealed(false);
        }
      } catch (e) {
        setReviewError(e instanceof Error ? e.message : "Failed to save review.");
      } finally {
        setGrading(false);
      }
    },
    [queue, index, grading, refreshDecks, refreshStats]
  );

  // Keyboard shortcuts 1-4 for grading once the answer is revealed.
  useEffect(() => {
    if (!revealed || sessionDone) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Grade> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      };
      const g = map[e.key];
      if (g) grade(g);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, sessionDone, grade]);

  const card = queue[index] ?? null;
  const selectedDeck = decks.find((d) => d._id === selectedDeckId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vocabs</h1>
          <p className="text-sm text-zinc-500">
            Korean + French flashcards with spaced repetition
          </p>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/paris"
            className="rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-amber-950 hover:bg-amber-300"
          >
            🗼 Paris journey
          </Link>
          <Link
            href="/chat"
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            AI chat partner
          </Link>
          {user && (
            <span className="hidden text-sm text-zinc-500 sm:inline">
              {user.name ?? user.email}
            </span>
          )}
        </nav>
      </header>

      {!user && (
        <div className="flex justify-start">
          <AuthPanel user={user} onAuth={setUser} />
        </div>
      )}
      {user && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Daily streak</p>
            <p className="text-2xl font-bold">
              {streak} <span className="text-sm font-normal">day{streak === 1 ? "" : "s"}</span>
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Heatmap days={days} />
          </div>
        </div>
      )}

      {decksError ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <p>{decksError}</p>
          <button
            onClick={refreshDecks}
            className="mt-2 rounded-full border border-current px-4 py-1.5 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      ) : (
        <DeckPicker
          decks={decks}
          selectedDeckId={selectedDeckId}
          onSelect={startReview}
          language={language}
          onLanguage={setLanguage}
          difficulty={difficulty}
          onDifficulty={setDifficulty}
          loggedIn={!!user}
        />
      )}

      {selectedDeck && (
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-lg font-semibold">
            Reviewing: {selectedDeck.name}
            {sessionTotal > 0 && !sessionDone && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {Math.min(index + 1, sessionTotal)} / {sessionTotal}
              </span>
            )}
          </h2>

          {loadingQueue && <p className="text-sm text-zinc-500">Loading cards…</p>}

          {!loadingQueue && queue.length === 0 && !reviewError && (
            <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
              Nothing due right now — pick another deck or come back tomorrow.
            </p>
          )}

          {sessionDone ? (
            <div className="text-center">
              <p className="text-lg font-semibold">Session complete.</p>
              <p className="text-sm text-zinc-500">
                You reviewed {sessionTotal} card{sessionTotal === 1 ? "" : "s"}.
              </p>
              <button
                onClick={() => selectedDeckId && startReview(selectedDeckId)}
                className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Review again
              </button>
            </div>
          ) : (
            card && (
              <>
                <div className="h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{
                      width: `${(index / Math.max(sessionTotal, 1)) * 100}%`,
                    }}
                  />
                </div>
                <Flashcard
                  card={card}
                  revealed={revealed}
                  onReveal={() => setRevealed(true)}
                />
                {revealed && (
                  <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
                    {GRADE_BUTTONS.map((b) => (
                      <button
                        key={b.grade}
                        onClick={() => grade(b.grade)}
                        disabled={grading}
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${b.cls}`}
                      >
                        {b.label}{" "}
                        <span className="opacity-70">({b.hint})</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          )}

          {reviewError && (
            <p className="text-sm text-red-600">{reviewError}</p>
          )}
        </section>
      )}

      {user && (
        <div className="flex justify-end">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              setUser(null);
              setQueue([]);
              setSelectedDeckId(null);
              setStreak(0);
              setDays([]);
            }}
            className="text-sm text-zinc-500 underline"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
