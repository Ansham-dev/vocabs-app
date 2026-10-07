import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import {
  authCookieOptions,
  AUTH_COOKIE,
  signToken,
  validateCredentials,
  verifyPassword,
} from "@/lib/auth";
import { withDB } from "@/lib/api";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { email, password } =
    (body as { email?: unknown; password?: unknown }) ?? {};
  const valid = validateCredentials(email, password);
  if ("error" in valid) {
    return NextResponse.json({ error: valid.error }, { status: 400 });
  }

  return withDB(async () => {
  // passwordHash has select:false in the schema — explicitly include it.
  const user = await User.findOne({ email: valid.email }).select(
    "+passwordHash email name"
  );
  if (!user?.passwordHash || !(await verifyPassword(valid.password, user.passwordHash))) {
    // Same message for unknown email vs wrong password (no user enumeration).
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    user: { id: String(user._id), email: user.email, name: user.name ?? null },
  });
  res.cookies.set(AUTH_COOKIE, await signToken(String(user._id)), authCookieOptions());
  return res;
  });
}
