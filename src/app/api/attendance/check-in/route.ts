import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Attendance } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc, today } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "mr") return err("Only MRs can check in", 403);

    const { location } = await req.json().catch(() => ({}));
    const todayStr = today();
    const mrId = me._id.toString();

    const existing = await Attendance.findOne({ mrId, date: todayStr });
    if (existing) return ok(serializeDoc(existing));

    const now = new Date();
    const checkIn = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

    const log = await Attendance.create({
      mrId, date: todayStr, checkIn,
      checkInLocation: location || null,
      status: "present",
    });

    return ok(serializeDoc(log), 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
