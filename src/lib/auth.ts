import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  // Check Authorization header first
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  // Fall back to cookie
  return req.cookies.get("fluense_token")?.value ?? null;
}

export async function getAuthUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.sub) return null;
  return payload as { sub: string; role: string; email: string };
}

// Middleware helper — throws Response if not authenticated / wrong role
export async function requireAuth(req: NextRequest, ...roles: string[]) {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (roles.length && !roles.includes(user.role)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  return user;
}
