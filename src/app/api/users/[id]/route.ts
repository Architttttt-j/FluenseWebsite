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

    if (me.role === "admin" &&
        user.regionId !== me.regionId &&
        user._id.toString() !== me._id.toString())
      return err("Access denied", 403);

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
      if (target.role !== "mr" || target.regionId !== me.regionId)
        return err("Admins can only edit MRs in their region", 403);
      delete body.role; // admins cannot promote
    }

    const allowed = ["name", "phone", "dob", "region", "regionId", "role"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const updated = await User.findByIdAndUpdate(params.id, update, { new: true });
    return ok(serializeUser(updated));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
