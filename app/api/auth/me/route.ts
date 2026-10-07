import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { getUserIdFromRequest } from "@/lib/auth";
import { withDB } from "@/lib/api";

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req).catch(() => null);
  if (!userId) return NextResponse.json({ user: null }, { status: 200 });
  return withDB(async () => {
    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ user: null }, { status: 200 });
    return NextResponse.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name ?? null,
      },
    });
  });
}
