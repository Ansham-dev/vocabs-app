import mongoose, { Schema, models, model } from "mongoose";
import type { Difficulty } from "./Deck";
import { DIFFICULTIES } from "./Deck";

export interface ICard {
  deckId: mongoose.Types.ObjectId;
  word: string;
  translation: string;
  exampleSentence?: string | null;
  // Korean only (e.g. "annyeonghaseyo"). Null for French.
  romanization?: string | null;
  difficulty: Difficulty;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    deckId: {
      type: Schema.Types.ObjectId,
      ref: "Deck",
      required: true,
      index: true,
    },
    word: { type: String, required: true, trim: true },
    translation: { type: String, required: true, trim: true },
    exampleSentence: { type: String, default: null },
    romanization: { type: String, default: null },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
  },
  { timestamps: true }
);

// Prevent duplicate seed inserts + speed up deck review queries.
CardSchema.index({ deckId: 1, word: 1 }, { unique: true });
CardSchema.index({ deckId: 1, difficulty: 1 });

export const Card = models.Card || model<ICard>("Card", CardSchema);
export default Card;
