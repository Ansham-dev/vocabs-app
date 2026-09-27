"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Language = "korean" | "french";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STARTERS: Record<Language, string> = {
  korean: "안녕하세요! (annyeonghaseyo — hello!) What would you like to talk about today?",
  french: "Bonjour ! What would you like to talk about today?",
};

export default function ChatPage() {
  const [language, setLanguage] = useState<Language>("korean");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: STARTERS.korean },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function switchLanguage(l: Language) {
    if (l === language) return;
    setLanguage(l);
    setMessages([{ role: "assistant", content: STARTERS[l] }]);
    setError(null);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, language }),
      });
      const data = await res.json();
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI conversation partner</h1>
          <p className="text-sm text-zinc-500">
            Practice chatting — the AI corrects you gently.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back to decks
        </Link>
      </header>

      <div className="flex items-center gap-2 text-sm">
        {(["korean", "french"] as const).map((l) => (
          <button
            key={l}
            onClick={() => switchLanguage(l)}
            className={`rounded-full px-4 py-1.5 font-medium capitalize ${
              language === l
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {l === "korean" ? "Korean" : "French"}
          </button>
        ))}
        {remaining !== null && (
          <span className="ml-auto text-xs text-zinc-500">
            {remaining} AI message{remaining === 1 ? "" : "s"} left today
          </span>
        )}
      </div>

      <div className="flex min-h-[300px] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "self-start bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="self-start rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500 dark:bg-zinc-800">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === "korean"
              ? "한국어로 말해 보세요… (try Korean…)"
              : "Écris en français… (try French…)"
          }
          maxLength={2000}
          className="flex-1 rounded-xl border border-zinc-300 bg-transparent px-4 py-2.5 text-sm dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Send
        </button>
      </form>
      <p className="text-xs text-zinc-500">
        Limited to 15 AI messages per day to control cost. Reviews are unlimited.
      </p>
    </div>
  );
}
