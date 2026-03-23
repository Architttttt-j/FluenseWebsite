import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { ok, err, serializeUser, getAuthUserDoc } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("Not allowed", 403);

    const target = await User.findById(params.id);
    if (!target) return err("User not found", 404);

    if (me.role === "admin" && (target.role !== "mr" || target.regionId !== me.regionId))
      return err("Admins can only toggle MRs in their region", 403);

    const newStatus = target.status === "active" ? "inactive" : "active";
    const updated = await User.findByIdAndUpdate(params.id, { status: newStatus }, { new: true });
    return ok(serializeUser(updated));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
