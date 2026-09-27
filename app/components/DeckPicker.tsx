"use client";

import type { DeckInfo } from "./types";

export type LanguageFilter = "all" | "korean" | "french";
export type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

const LANGUAGES: { id: LanguageFilter; label: string }[] = [
  { id: "all", label: "Both" },
  { id: "korean", label: "Korean" },
  { id: "french", label: "French" },
];

const DIFFICULTIES: { id: DifficultyFilter; label: string }[] = [
  { id: "all", label: "All levels" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export default function DeckPicker({
  decks,
  selectedDeckId,
  onSelect,
  language,
  onLanguage,
  difficulty,
  onDifficulty,
  loggedIn,
}: {
  decks: DeckInfo[];
  selectedDeckId: string | null;
  onSelect: (id: string) => void;
  language: LanguageFilter;
  onLanguage: (l: LanguageFilter) => void;
  difficulty: DifficultyFilter;
  onDifficulty: (d: DifficultyFilter) => void;
  loggedIn: boolean;
}) {
  const visible = decks.filter(
    (d) =>
      (language === "all" || d.language === language) &&
      (difficulty === "all" || d.difficulty === difficulty)
  );

  return (
    <section>
      <div className="mb-3 flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => onLanguage(l.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              language === l.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {l.label}
          </button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-zinc-300 sm:block dark:bg-zinc-700" />
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            onClick={() => onDifficulty(d.id)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              difficulty === d.id
                ? "bg-zinc-600 text-white dark:bg-zinc-300 dark:text-zinc-900"
                : "border border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-zinc-500">
          No decks yet — run <code>npm run seed</code> after setting MONGODB_URI.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((d) => {
          const selected = d._id === selectedDeckId;
          return (
            <button
              key={d._id}
              onClick={() => onSelect(d._id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-zinc-900 ring-2 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              } bg-white dark:bg-zinc-900`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {d.language} · {d.difficulty}
                </span>
                {loggedIn && d.dueCount !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.dueCount > 0
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    }`}
                  >
                    {d.dueCount > 0 ? `${d.dueCount} due` : "done"}
                  </span>
                )}
              </div>
              <h3 className="font-semibold">{d.name}</h3>
              {d.description && (
                <p className="mt-1 text-sm text-zinc-500">{d.description}</p>
              )}
              <p className="mt-2 text-xs text-zinc-400">{d.cardCount} cards</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
