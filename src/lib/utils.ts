import { NextResponse } from "next/server";
import { connectDB } from "./db/mongoose";
import { User } from "./models";
import { getAuthUser } from "./auth";
import { NextRequest } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serializeUser(u: any) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    region: u.region,
    regionId: u.regionId,
    phone: u.phone,
    dob: u.dob,
    joinDate: u.joinDate,
    status: u.status,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  };
}

export function serializeDoc(doc: any) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id?.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

// Wraps a route handler with DB connection + auth check
export function withDB<T>(
  handler: (req: NextRequest, ctx: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: T) => {
    try {
      await connectDB();
      return await handler(req, ctx);
    } catch (e: any) {
      if (e instanceof Response) return e;
      console.error(e);
      return err(e.message || "Internal server error", 500);
    }
  };
}

// Get full user doc from auth token
export async function getAuthUserDoc(req: NextRequest) {
  await connectDB();
  const payload = await getAuthUser(req);
  if (!payload) return null;
  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") return null;
  return user;
}

// Date helpers
export function today() {
  return new Date().toISOString().split("T")[0];
}

export function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
