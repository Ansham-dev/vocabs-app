# Voilà Vocabs — standalone French vocabulary app

Built from your existing word resources in `../voila/data/`:
- `course.json` (Course lessons)
- `cosmopolite-a1/a2/b1.json`
- `delf-a1/a2/b1.json`

Consolidated + de-duplicated: **4241 words** with level (A1/A2/B1), source, theme, example.

## Run

The app is static (no build, no install). Because browsers block `fetch` on `file://`,
serve it locally:

```powershell
cd vocab-app
python -m http.server 8080
```

Then open **http://localhost:8080**

Or double-click `index.html` — Explore works only when served (see message in page).

## Rebuild words after editing source data

```powershell
python vocab-app/build_vocab.py
```

## Features

- 📚 **Explore** — search FR/EN, filter by level + source + learned status, listen 🔊 (built-in voice), mark known ☆
- 🃏 **Flashcards** — flip cards, shuffle, hide-known, prev/next, progress bar, auto-saves
- 🎯 **Quiz** — 4-choice FR→EN / EN→FR, score + streak + best, auto-pronounces each word
- Progress (`known` words + quiz best) saved in `localStorage` — no account needed
- Mobile-friendly, offline (except voices come from the OS/browser)
