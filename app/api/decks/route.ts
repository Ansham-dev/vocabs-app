import { NextRequest, NextResponse } from "next/server";
import { Deck } from "@/models/Deck";
import { Card } from "@/models/Card";
import { ReviewHistory } from "@/models/ReviewHistory";
import { getUserIdFromRequest } from "@/lib/auth";
import { withDB } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

// GET /api/decks -> decks with card counts; dueCount included when logged in.
// Self-seeds on first run (empty DB), so production needs no manual step.
// NOTE: loads all card ids into memory — fine for 400 seed cards. At real
// scale this becomes a $lookup aggregation with pagination.
export async function GET(req: NextRequest) {
  return withDB(async () => {
    await ensureSeeded();
    const decks = await Deck.find({}).sort({ language: 1, difficulty: 1 }).lean();
    const cards = await Card.find({}, { deckId: 1 }).lean();

    const counts = new Map<string, number>();
    const idsByDeck = new Map<string, string[]>();
    for (const c of cards) {
      const k = String(c.deckId);
      counts.set(k, (counts.get(k) ?? 0) + 1);
      const arr = idsByDeck.get(k) ?? [];
      arr.push(String(c._id));
      idsByDeck.set(k, arr);
    }

    const userId = await getUserIdFromRequest(req);
    const dueByDeck = new Map<string, number>();
    if (userId) {
      const histories = await ReviewHistory.find({ userId }).lean();
      const nextByCard = new Map(
        histories.map((h) => [String(h.cardId), h.nextReviewDate.getTime()])
      );
      const now = Date.now();
      for (const [deckKey, ids] of idsByDeck) {
        let due = 0;
        for (const id of ids) {
          const next = nextByCard.get(id);
          if (next === undefined || next <= now) due++;
        }
        dueByDeck.set(deckKey, due);
      }
    }

    return NextResponse.json({
      decks: decks.map((d) => {
        const key = String(d._id);
        return {
          _id: key,
          language: d.language,
          name: d.name,
          difficulty: d.difficulty,
          description: d.description ?? null,
          cardCount: counts.get(key) ?? 0,
          dueCount: userId ? (dueByDeck.get(key) ?? 0) : null,
        };
      }),
    });
  });
}
