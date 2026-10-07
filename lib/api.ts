import { NextResponse } from "next/server";
import { connectDB } from "./mongodb";

// Wrap an API handler so infrastructure failures (missing MONGODB_URI /
// unreachable Atlas / missing JWT_SECRET) always come back as JSON with a
// human Hint — never an empty 500. Usage:
//
//   export async function GET(req: NextRequest) {
//     return withDB(async () => {
//       ... existing code (no connectDB() call needed) ...
//     });
//   }
export async function withDB(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await connectDB();
  } catch (e) {
    return NextResponse.json(
      {
        error: "Database unavailable.",
        hint: "Add MONGODB_URI to your Vercel project env vars (and JWT_SECRET, min 16 chars), redeploy, then reload — decks seed themselves on first run.",
        detail: e instanceof Error ? e.message : "unknown error",
      },
      { status: 503 }
    );
  }
  try {
    return await fn();
  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json(
      { error: "Something went wrong.", hint: "Reload and try again." },
      { status: 500 }
    );
  }
}
