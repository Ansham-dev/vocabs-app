// Auth helpers: custom JWT (jose) + bcrypt password hashing.
//
// TRADEOFF (NextAuth vs custom JWT): NextAuth/Auth.js buys OAuth providers and
// session plumbing, but adds a DB adapter, more env config, and magic that is
// hard to defend in an interview. This app only needs email+password with
// per-user review history, so ~80 lines of explicit JWT-in-httpOnly-cookie
// code is easier to explain and has zero extra infrastructure. If Google/GitHub
// login becomes a requirement, migrate to Auth.js then.

import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE = "vocabs_token";
const TOKEN_TTL = "7d";

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "Missing JWT_SECRET (min 16 chars). Copy .env.example to .env.local."
    );
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Read the session cookie from a request and return the user id, or null. */
export async function getUserIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(
  email: unknown,
  password: unknown
): { email: string; password: string } | { error: string } {
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return { error: "Enter a valid email address." };
  }
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  return { email: email.trim().toLowerCase(), password };
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches TOKEN_TTL
  };
}
