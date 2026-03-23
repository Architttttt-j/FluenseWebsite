import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { hashPassword } from "@/lib/auth";
import { ok, err, serializeUser, getAuthUserDoc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const query: Record<string, any> = {};

    if (me.role === "admin") {
      query.regionId = me.regionId;
      query.role = "mr";
    } else {
      const regionId = searchParams.get("regionId");
      const role = searchParams.get("role");
      const status = searchParams.get("status");
      if (regionId) query.regionId = regionId;
      if (role) query.role = role;
      if (status) query.status = status;
    }

    let users = await User.find(query).sort({ createdAt: -1 });

    const search = searchParams.get("search");
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
      );
    }

    return ok({ users: users.map(serializeUser), total: users.length });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("MRs cannot create users", 403);

    const body = await req.json();
    const { name, email, password, role, regionId, region, phone, dob, joinDate } = body;

    if (!name || !email || !password) return err("name, email and password are required");

    if (me.role === "admin") {
      if (role && role !== "mr") return err("Admins can only create MRs", 403);
      body.role = "mr";
      body.regionId = me.regionId;
      body.region = me.region;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return err("Email already in use", 409);

    const user = await User.create({
      name, email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      role: body.role || role || "mr",
      regionId: body.regionId || regionId,
      region: body.region || region,
      phone, dob,
      joinDate: joinDate || new Date().toISOString().split("T")[0],
    });

    return ok(serializeUser(user), 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
