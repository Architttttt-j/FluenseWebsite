import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Attendance, User } from "@/lib/models";
import { ok, err, getAuthUserDoc } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("MRs cannot delete attendance", 403);

    const attendance = await Attendance.findById(params.id);
    if (!attendance) return err("Attendance not found", 404);

    if (me.role === "admin") {
      const mr = await User.findById(attendance.mrId);
      if (mr && mr.regionId !== me.regionId) return err("Access denied", 403);
    }

    await Attendance.findByIdAndDelete(params.id);
    return ok({ message: "Attendance deleted" });
  } catch (e: any) {
    return err(e.message, 500);
  }
}