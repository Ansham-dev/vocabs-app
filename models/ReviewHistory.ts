import mongoose, { Schema, models, model } from "mongoose";

export interface IReviewHistory {
  userId: mongoose.Types.ObjectId;
  cardId: mongoose.Types.ObjectId;
  lastReviewed: Date;
  nextReviewDate: Date;
  // SM-2 state. Defaults match a brand-new card (see lib/sm2.ts in Step 4).
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewHistorySchema = new Schema<IReviewHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    lastReviewed: { type: Date, default: () => new Date() },
    nextReviewDate: { type: Date, required: true, index: true },
    easeFactor: { type: Number, default: 2.5, min: 1.3 },
    interval: { type: Number, default: 0, min: 0 },
    repetitions: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// One SM-2 state row per user+card. Upsert on every review.
ReviewHistorySchema.index({ userId: 1, cardId: 1 }, { unique: true });
// Hot query: "all cards due for user X" sorted by date.
ReviewHistorySchema.index({ userId: 1, nextReviewDate: 1 });

export const ReviewHistory =
  models.ReviewHistory ||
  model<IReviewHistory>("ReviewHistory", ReviewHistorySchema);
export default ReviewHistory;
