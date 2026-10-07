import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Card } from "@/models/Card";
import { ReviewHistory } from "@/models/ReviewHistory";
import { getUserIdFromRequest } from "@/lib/auth";
import { withDB } from "@/lib/api";

// GET /api/review/due?deckId=...&limit=20
// Cards due now (never reviewed, or nextReviewDate passed), overdue first.
// Requires login — review state is per user.
export async function GET(req: NextRequest) {
  return withDB(async () => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Log in to review — progress is saved per user." },
      { status: 401 }
    );
  }
  const deckId = req.nextUrl.searchParams.get("deckId");
  if (!deckId || !mongoose.Types.ObjectId.isValid(deckId)) {
    return NextResponse.json({ error: "Valid deckId is required." }, { status: 400 });
  }
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20, 1),
    50
  );

  const cards = await Card.find({ deckId }).lean();
  const histories = await ReviewHistory.find({
    userId,
    cardId: { $in: cards.map((c) => c._id) },
  }).lean();
  const stateByCard = new Map(histories.map((h) => [String(h.cardId), h]));

  const now = Date.now();
  const due = cards.filter((c) => {
    const h = stateByCard.get(String(c._id));
    return !h || h.nextReviewDate.getTime() <= now;
  });

  // Overdue (oldest nextReviewDate) first, then brand-new cards.
  due.sort((a, b) => {
    const ha = stateByCard.get(String(a._id));
    const hb = stateByCard.get(String(b._id));
    const ta = ha ? ha.nextReviewDate.getTime() : Infinity;
    const tb = hb ? hb.nextReviewDate.getTime() : Infinity;
    return ta - tb;
  });

  return NextResponse.json({
    cards: due.slice(0, limit).map((c) => {
      const h = stateByCard.get(String(c._id));
      return {
        _id: String(c._id),
        word: c.word,
        translation: c.translation,
        exampleSentence: c.exampleSentence ?? null,
        romanization: c.romanization ?? null,
        difficulty: c.difficulty,
        isNew: !h,
        repetitions: h?.repetitions ?? 0,
      };
    }),
    totalDue: due.length,
  });
  });
}
