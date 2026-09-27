import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// GET /api/health -> { ok, db } — cheap readiness probe for Vercel/deploy.
export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db?.admin().ping();
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, db: e instanceof Error ? e.message : "unknown error" },
      { status: 503 }
    );
  }
}
