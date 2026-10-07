import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ReviewHistory } from "@/models/ReviewHistory";
import { getUserIdFromRequest } from "@/lib/auth";
import { withDB } from "@/lib/api";

const WINDOW_DAYS = 120;

// GET /api/stats -> { streak, totalReviews, reviewsByDay: [{date, count}] }
// Dates are UTC yyyy-mm-dd. Streak = consecutive days with >=1 review,
// counting today-or-yesterday as the anchor (so a user reviewing daily
// doesn't lose the streak before today's first review).
export async function GET(req: NextRequest) {
  return withDB(async () => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Log in to see stats." }, { status: 401 });
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await ReviewHistory.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { userId: toObjectId(userId), lastReviewed: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$lastReviewed" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  const days: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)
    );
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: byDay.get(key) ?? 0 });
  }

  const active = new Set(
    days.filter((d) => d.count > 0).map((d) => d.date)
  );
  let streak = 0;
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  // Anchor: streak stays alive if the last review was yesterday.
  if (!active.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (active.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const totalAgg = await ReviewHistory.aggregate<{ total: number }>([
    { $match: { userId: toObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$repetitions" } } },
  ]);

  return NextResponse.json({
    streak,
    totalCardStates: totalAgg[0]?.total ?? 0,
    reviewsByDay: days,
  });
  });
}

function toObjectId(id: string) {
  // Aggregate $match needs a real ObjectId, not a string.
  return new mongoose.Types.ObjectId(id);
}
