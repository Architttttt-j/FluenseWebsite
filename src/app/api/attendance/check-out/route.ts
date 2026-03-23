import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Attendance } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc, today } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "mr") return err("Only MRs can check out", 403);

    const { location } = await req.json().catch(() => ({}));
    const log = await Attendance.findOne({ mrId: me._id.toString(), date: today() });
    if (!log) return err("No check-in found for today", 404);

    const now = new Date();
    const checkOut = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const updated = await Attendance.findByIdAndUpdate(
      log._id,
      { checkOut, checkOutLocation: location || null },
      { new: true }
    );
    return ok(serializeDoc(updated));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
