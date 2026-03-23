import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Attendance, User } from "@/lib/models";
import { ok, err, getAuthUserDoc, today } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("Forbidden", 403);

    const query: Record<string, any> = { role: "mr", status: "active" };
    if (me.role === "admin") query.regionId = me.regionId;

    const mrs = await User.find(query);
    const mrIds = mrs.map((u: any) => u._id.toString());
    const present = await Attendance.find({ mrId: { $in: mrIds }, date: today() });
    const presentIds = present.map((a: any) => a.mrId);

    return ok({
      totalMrs: mrIds.length,
      present: present.length,
      absent: mrIds.length - present.length,
      presentMrIds: presentIds,
      date: today(),
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
