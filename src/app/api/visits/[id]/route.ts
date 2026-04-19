import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User } from "@/lib/models";
import { ok, err, getAuthUserDoc } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("MRs cannot delete visits", 403);

    const visit = await Visit.findById(params.id);
    if (!visit) return err("Visit not found", 404);

    if (me.role === "admin") {
      const mr = await User.findById(visit.mrId);
      if (mr && mr.regionId !== me.regionId) return err("Access denied", 403);
    }

    await Visit.findByIdAndDelete(params.id);
    return ok({ message: "Visit deleted" });
  } catch (e: any) {
    return err(e.message, 500);
  }
}