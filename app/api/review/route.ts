import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ReviewHistory } from "@/models/ReviewHistory";
import { getUserIdFromRequest } from "@/lib/auth";
import { assertGrade, INITIAL_STATE, reviewCard } from "@/lib/sm2";

// POST /api/review { cardId, grade } -> runs SM-2, upserts ReviewHistory.
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Log in to save reviews." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { cardId, grade } = (body as { cardId?: unknown; grade?: unknown }) ?? {};
  if (typeof cardId !== "string" || !mongoose.Types.ObjectId.isValid(cardId)) {
    return NextResponse.json({ error: "Valid cardId is required." }, { status: 400 });
  }
  let g;
  try {
    g = assertGrade(grade);
  } catch {
    return NextResponse.json(
      { error: "grade must be one of: again, hard, good, easy." },
      { status: 400 }
    );
  }

  await connectDB();
  const now = new Date();
  const existing = await ReviewHistory.findOne({ userId, cardId });
  const prev = existing
    ? {
        easeFactor: existing.easeFactor,
        interval: existing.interval,
        repetitions: existing.repetitions,
      }
    : INITIAL_STATE;

  const next = reviewCard(prev, g, now);

  await ReviewHistory.findOneAndUpdate(
    { userId, cardId },
    {
      $set: {
        lastReviewed: now,
        nextReviewDate: next.nextReviewDate,
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetitions: next.repetitions,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({
    state: {
      easeFactor: next.easeFactor,
      interval: next.interval,
      repetitions: next.repetitions,
      nextReviewDate: next.nextReviewDate.toISOString(),
    },
  });
}
