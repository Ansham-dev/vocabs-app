// One-shot seed script: `npm run seed` (or `node scripts/seed.mjs`).
// Creates 6 decks (language x difficulty) and upserts 400 cards from
// data/korean.seed.json + data/french.seed.json.
//
// Idempotent: re-running only updates existing cards (matched on the
// unique deckId+word index), so it is safe to run after adding words.
//
// The app itself NEVER generates vocab live — it only queries this data.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Minimal .env.local loader (avoids a dotenv dependency for a one-shot script).
function loadLocalEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

const DECKS = [
  { language: "korean", difficulty: "beginner", name: "TOPIK I · Beginner", description: "Most common TOPIK I words: everyday nouns, verbs and adjectives." },
  { language: "korean", difficulty: "intermediate", name: "TOPIK I · Intermediate", description: "Abstract nouns, adverbs and connectors for longer sentences." },
  { language: "korean", difficulty: "advanced", name: "TOPIK I · Advanced", description: "Society, culture and opinion words for stretch goals." },
  { language: "french", difficulty: "beginner", name: "Français A1 · Débutant", description: "Everyday A1 words: greetings, family, food, core verbs." },
  { language: "french", difficulty: "intermediate", name: "Français A2 · Intermédiaire", description: "A2 words: abstract nouns, connectors, irregular verbs." },
  { language: "french", difficulty: "advanced", name: "Français A2+ · Avancé", description: "Society and opinion words for confident conversation." },
];

async function main() {
  loadLocalEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<user>")) {
    console.error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and fill in a real Atlas connection string."
    );
    process.exit(1);
  }

  const korean = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "korean.seed.json"), "utf8")
  );
  const french = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "french.seed.json"), "utf8")
  );
  console.log(`Loaded ${korean.length} Korean + ${french.length} French cards.`);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 });

  // Models defined inline (not imported from TS) so plain node can run this.
  const deckSchema = new mongoose.Schema(
    {
      language: { type: String, enum: ["korean", "french"], required: true },
      name: { type: String, required: true },
      difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
      description: { type: String, default: null },
    },
    { timestamps: true }
  );
  const Deck = mongoose.models.Deck || mongoose.model("Deck", deckSchema);

  const cardSchema = new mongoose.Schema(
    {
      deckId: { type: mongoose.Schema.Types.ObjectId, ref: "Deck", required: true },
      word: { type: String, required: true, trim: true },
      translation: { type: String, required: true, trim: true },
      exampleSentence: { type: String, default: null },
      romanization: { type: String, default: null },
      difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    },
    { timestamps: true }
  );
  cardSchema.index({ deckId: 1, word: 1 }, { unique: true });
  const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);

  const deckIds = {};
  for (const d of DECKS) {
    const deck = await Deck.findOneAndUpdate(
      { language: d.language, difficulty: d.difficulty },
      { $set: { name: d.name, description: d.description } },
      { upsert: true, new: true }
    );
    deckIds[`${d.language}:${d.difficulty}`] = deck._id;
  }
  console.log(`Upserted ${DECKS.length} decks.`);

  const ops = [...korean, ...french].map((c) => ({
    updateOne: {
      filter: {
        deckId: deckIds[`${c.language}:${c.difficulty}`],
        word: c.word,
      },
      update: {
        $set: {
          deckId: deckIds[`${c.language}:${c.difficulty}`],
          word: c.word,
          translation: c.translation,
          exampleSentence: c.exampleSentence ?? null,
          romanization: c.romanization ?? null,
          difficulty: c.difficulty,
        },
      },
      upsert: true,
    },
  }));

  const res = await Card.bulkWrite(ops, { ordered: false });
  console.log(
    `Cards: upserted=${res.upsertedCount} modified=${res.modifiedCount} total=${await Card.countDocuments()}`
  );
  await mongoose.disconnect();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
