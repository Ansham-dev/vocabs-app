import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  authCookieOptions,
  AUTH_COOKIE,
  hashPassword,
  signToken,
  validateCredentials,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { email, password, name } =
    (body as { email?: unknown; password?: unknown; name?: unknown }) ?? {};
  const valid = validateCredentials(email, password);
  if ("error" in valid) {
    return NextResponse.json({ error: valid.error }, { status: 400 });
  }

  await connectDB();
  const existing = await User.findOne({ email: valid.email }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const user = await User.create({
    email: valid.email,
    passwordHash: await hashPassword(valid.password),
    name: typeof name === "string" && name.trim() ? name.trim() : null,
  });

  const res = NextResponse.json(
    {
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name ?? null,
      },
    },
    { status: 201 }
  );
  res.cookies.set(AUTH_COOKIE, await signToken(String(user._id)), authCookieOptions());
  return res;
}
