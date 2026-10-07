"use client";

import type { DueCard } from "./types";

export default function Flashcard({
  card,
  revealed,
  onReveal,
}: {
  card: DueCard;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <div
      onClick={() => !revealed && onReveal()}
      className={`w-full max-w-xl cursor-pointer rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 ${
        revealed ? "cursor-default" : "hover:border-zinc-400"
      }`}
    >
      {card.isNew && (
        <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          new card
        </span>
      )}
      <p className="text-4xl font-bold tracking-tight">{card.word}</p>
      {card.romanization && (
        <p className="mt-2 text-lg text-zinc-500">{card.romanization}</p>
      )}
      {!revealed ? (
        <p className="mt-6 text-sm text-zinc-400">Tap to reveal the answer</p>
      ) : (
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <p className="text-2xl font-semibold text-green-700 dark:text-green-300">
            {card.translation}
          </p>
          {card.exampleSentence && (
            <p className="mt-3 text-zinc-600 italic dark:text-zinc-300">
              {card.exampleSentence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
