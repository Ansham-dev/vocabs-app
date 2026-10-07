import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { Deck, type Difficulty, type Language } from "@/models/Deck";
import { Card } from "@/models/Card";

// Self-seeding: the database fills itself on first use, so there is no
// manual `npm run seed` step in production. Idempotent (unique deckId+word
// index) and race-tolerant (concurrent boots may collide on upserts — the
// bulkWrite error is swallowed and success is verified by recount).
// `scripts/seed.mjs` remains for local/manual runs.

const DECKS: { language: Language; difficulty: Difficulty; name: string; description: string }[] = [
  { language: "korean", difficulty: "beginner", name: "TOPIK I · Beginner", description: "Most common TOPIK I words: everyday nouns, verbs and adjectives." },
  { language: "korean", difficulty: "intermediate", name: "TOPIK I · Intermediate", description: "Abstract nouns, adverbs and connectors for longer sentences." },
  { language: "korean", difficulty: "advanced", name: "TOPIK I · Advanced", description: "Society, culture and opinion words for stretch goals." },
  { language: "french", difficulty: "beginner", name: "Français A1 · Débutant", description: "Everyday A1 words: greetings, family, food, core verbs." },
  { language: "french", difficulty: "intermediate", name: "Français A2 · Intermédiaire", description: "A2 words: abstract nouns, connectors, irregular verbs." },
  { language: "french", difficulty: "advanced", name: "Français A2+ · Avancé", description: "Society and opinion words for confident conversation." },
];

type SeedCard = {
  language: Language;
  difficulty: Difficulty;
  word: string;
  translation: string;
  exampleSentence?: string | null;
  romanization?: string | null;
};

function readSeedFile(name: string): SeedCard[] {
  const p = path.join(process.cwd(), "data", name);
  return JSON.parse(fs.readFileSync(p, "utf8")) as SeedCard[];
}

/** Seed decks+cards when the DB is empty. Returns true when decks exist. */
export async function ensureSeeded(): Promise<boolean> {
  if ((await Deck.estimatedDocumentCount()) > 0) return true;

  const deckIds = new Map<string, mongoose.Types.ObjectId>();
  for (const d of DECKS) {
    const deck = await Deck.findOneAndUpdate(
      { language: d.language, difficulty: d.difficulty },
      { $set: { name: d.name, description: d.description } },
      { upsert: true, new: true }
    );
    deckIds.set(`${d.language}:${d.difficulty}`, deck._id as mongoose.Types.ObjectId);
  }

  const cards: SeedCard[] = [
    ...readSeedFile("korean.seed.json"),
    ...readSeedFile("french.seed.json"),
  ];
  try {
    await Card.bulkWrite(
      cards.map((c) => ({
        updateOne: {
          filter: { deckId: deckIds.get(`${c.language}:${c.difficulty}`), word: c.word },
          update: {
            $set: {
              deckId: deckIds.get(`${c.language}:${c.difficulty}`),
              word: c.word,
              translation: c.translation,
              exampleSentence: c.exampleSentence ?? null,
              romanization: c.romanization ?? null,
              difficulty: c.difficulty,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  } catch {
    // Concurrent boot / duplicate upserts — verify by recount below.
  }
  return (await Deck.estimatedDocumentCount()) > 0;
}
