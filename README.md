# Vocabs — Korean & French flashcards + 🗼 Paris la Nuit

![CI](https://github.com/Ansham-dev/vocabs-app/actions/workflows/ci/badge.svg)

Two apps in one deployment:

- **Vocabs trainer** (`/`) — spaced-repetition vocabulary trainer (TOPIK I Korean + A1/A2 French)
  with per-user review history, streaks + activity heatmap, and an AI conversation partner.
  Stack: **Next.js (App Router) + TypeScript + Mongoose/MongoDB + Tailwind**.
- **🗼 Paris la Nuit** (`/paris`) — static French vocab game (4241 A1–B1 words from
  `build_vocab.py`): 6 Paris districts with an easy→hard curve (🟢 Montmartre/Café →
  🟡 Champs/Gare → 🔴 Île/Latin boss zone), Eiffel Tower that lights up as you master
  words, combos, 8 badges, confetti. Progress saved in `localStorage` (browser-only).
  Rebuild words with `python build_vocab.py` (reads `../voila/data`, not in this repo).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
npm run seed                 # one-time: creates 6 decks + 400 cards
npm run dev
```

Other scripts: `npm test` (Vitest), `npm run lint`, `npm run build`.

## How it works

- **Decks/cards** (`/api/decks`, `/api/review/due`) are read from MongoDB — the app
  never generates vocab live. Seed data lives in `data/*.seed.json`, authored from
  `scripts/seed_data_{kr,fr}.py` and loaded idempotently by `scripts/seed.mjs`
  (upsert on the unique `deckId+word` index, so re-runs are safe).
- **Reviews** (`POST /api/review`) run the SM-2 engine in `lib/sm2.ts` and upsert
  one `ReviewHistory` row per user+card. Grades: again / hard / good / easy
  (keyboard: 1–4). New cards start at EF 2.5; `again` resets repetitions and
  brings the card back in ~10 minutes.
- **Auth** is email+password with bcrypt hashes and a JWT in an httpOnly cookie
  (`lib/auth.ts`, `/api/auth/*`). Review history and streaks are per user.
- **AI chat** (`/chat` → `POST /api/chat`) proxies OpenAI server-side. The key
  never reaches the browser. Limited to **15 messages/day per user (or IP)** via
  the sliding-window limiter in `lib/rate-limit.ts`; failures return friendly
  errors, never a crashed chat.

## Architecture decisions (tradeoffs)

| Choice | Picked | Alternative | Why |
|---|---|---|---|
| DB driver | Mongoose | Native driver | Schemas + validation colocated with code; unique indexes enforce seed idempotency. Slight overhead vs native — irrelevant at this scale. |
| Auth | Custom JWT + bcrypt | NextAuth/Auth.js | Only email+password is needed; ~100 explicit lines are easy to defend in an interview. Migrate to Auth.js if OAuth login becomes a requirement. |
| AI provider | OpenAI `gpt-4o-mini` | Anthropic Sonnet | Cheapest capable option for short tutoring turns; plain `fetch`, no SDK. Override with `OPENAI_MODEL`. |
| Rate limiting | In-memory sliding window | Upstash Redis | Zero infra, exact for single-instance dev. On Vercel each serverless instance has its own memory, so the 15/day cap is approximate under concurrency — use Redis for a strict global cap. |
| Vocab source | Seeded JSON, queried from DB | Live AI generation | Deterministic, free at runtime, reviewable content. The app never calls AI for vocab. |

## Deployment (Vercel)

1. Set env vars in the Vercel dashboard: `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`
   (+ optional `OPENAI_MODEL`). Never commit `.env.local`.
2. **MongoDB pooling (serverless):** `lib/mongodb.ts` caches the connection on
   `globalThis`, so hot function invocations reuse one connection instead of
   exhausting the Atlas connection limit. `serverSelectionTimeoutMS: 5000` fails
   fast instead of buffering forever.
3. **Build without secrets:** env checks are lazy (inside functions, not module
   scope), so `next build` succeeds on CI/Vercel without a live DB.
4. Run `npm run seed` once against the production DB (from your machine with the
   Atlas URI) to populate decks/cards.
5. `/api/health` is a cheap readiness probe (DB ping) for uptime checks.

## Project structure

```
app/
  page.tsx              review flow (deck picker, flashcards, streak+heatmap)
  chat/page.tsx         AI conversation partner UI
  api/{auth,decks,review,stats,chat,health}/  route handlers
  components/           AuthPanel, DeckPicker, Flashcard, Heatmap
public/paris/           static Paris la Nuit game (index.html + vocab.json, 4241 words)
build_vocab.py          rebuilds public/paris/vocab.json from ../voila/data
lib/
  mongodb.ts            cached Mongoose connection (serverless-safe)
  sm2.ts                pure SM-2 engine (+ sm2.test.ts)
  auth.ts               JWT + bcrypt helpers
  rate-limit.ts         sliding-window limiter (+ rate-limit.test.ts)
models/                 User, Deck, Card, ReviewHistory (Mongoose schemas)
data/                   korean.seed.json, french.seed.json (200 words each)
scripts/                seed.mjs (one-shot loader), seed_data_*.py (sources)
.github/workflows/ci.yml  tests + lint + build on every push
```
