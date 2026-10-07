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

## Features (Memrise-style 🌱 + Paris la Nuit 🗼)

- 🗼 **Night Journey** (the wow) — 4241 words mapped onto 6 Paris districts (Montmartre, Café de Flore, Champs-Élysées, Gare du Nord, Île Saint-Louis, Quartier Latin). Master words to light each district and make the Eiffel Tower glow. Districts unlock as you progress
- 🌱 **Learn** — plant 5 seeds at a time: see + hear → tap meaning → type → listening test
- 🏋️ **Practice** — no-pressure exam (10/20/30 questions) in Voilà app style: tap meanings · listening · typing with accent bar (é è ç…). Mistakes don't hurt your plants
- 💧 **Review** — water weakest words first, 10 mixed tests (tap / type / listen)
- ⚡ **Speed review** — 60-second rapid-fire round with personal best
- 🔥 **Difficult words** — mistakes land here automatically for focused training
- 🌸 **Growth system** — every word grows Seed → Sprout → Growing → Mastered with XP, ranks (Touriste → Immortel), daily 100 XP goal ring + day streak
- 📚 **Words** — search all 4241 words by level + growth stage, listen 🔊, flag hard ones
- Progress saved in `localStorage` — no account needed. Accent-insensitive typing ("cafe" = "café")
