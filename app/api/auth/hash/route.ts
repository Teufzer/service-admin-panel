import { randomBytes, scryptSync } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/hash
 * Body: { password: string }
 * Returns: { hash: "scrypt:salt:hash" }
 *
 * Used to generate a hashed password to put in ADMIN_CREDENTIALS env var.
 * Example: ADMIN_CREDENTIALS=admin@vokx.org:scrypt:abc123:def456...
 */
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return NextResponse.json({ hash: `scrypt:${salt}:${hash}` });
}
