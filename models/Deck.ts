import { Schema, models, model } from "mongoose";

export const LANGUAGES = ["korean", "french"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface IDeck {
  language: Language;
  name: string;
  difficulty: Difficulty;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeckSchema = new Schema<IDeck>(
  {
    language: { type: String, enum: LANGUAGES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

DeckSchema.index({ language: 1, difficulty: 1 });

export const Deck = models.Deck || model<IDeck>("Deck", DeckSchema);
export default Deck;
