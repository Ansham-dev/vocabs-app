"use client";

import { useState } from "react";
import type { SessionUser } from "./types";

export default function AuthPanel({
  user,
  onAuth,
}: {
  user: SessionUser | null | undefined;
  onAuth: (u: SessionUser | null) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user === undefined) {
    return <p className="text-sm text-zinc-500">Checking session…</p>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {user.name ?? user.email}
        </span>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            onAuth(null);
          }}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Log out
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onAuth(data.user);
      setPassword("");
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-4 flex gap-2 text-sm font-medium">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full px-4 py-1.5 capitalize ${
              mode === m
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>
      {mode === "register" && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="mb-2 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        />
      )}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        required
        className="mb-2 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 8 chars)"
        type="password"
        required
        minLength={8}
        className="mb-3 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
      />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>
      <p className="mt-3 text-xs text-zinc-500">
        Progress and streaks are saved per account.
      </p>
    </form>
  );
}
