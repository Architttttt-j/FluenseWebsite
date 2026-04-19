import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { ok, err, serializeUser, getAuthUserDoc } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const user = await User.findById(params.id);
    if (!user) return err("User not found", 404);

    if (me.role === "mr" && user._id.toString() !== me._id.toString()) return err("MRs can only view their own profile", 403);

    return ok(serializeUser(user));
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const target = await User.findById(params.id);
    if (!target) return err("User not found", 404);

    const body = await req.json();

    if (me.role === "mr") return err("MRs cannot edit profiles", 403);
    if (me.role === "admin") {
      // Admins can edit anyone, but cannot promote to admin or head_admin
      if (body.role && body.role !== "mr") return err("Admins cannot change roles to admin or head_admin", 403);
    }
    if (me.role === "head_admin") {
      // Head admins can do anything
    }

    const allowed = ["name", "email", "phone", "dob", "region", "regionId", "role"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "email") update.email = body.email.toLowerCase();
        else update[key] = body[key];
      }
    }

    const updated = await User.findByIdAndUpdate(params.id, update, { new: true });
    return ok(serializeUser(updated));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
