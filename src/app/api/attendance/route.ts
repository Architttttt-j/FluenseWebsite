import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Attendance, User } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc, today, daysAgo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const query: Record<string, any> = {};

    if (me.role === "mr") {
      query.mrId = me._id.toString();
    } else {
      const mrId = searchParams.get("mrId");
      if (mrId) {
        if (me.role === "admin") {
          const target = await User.findById(mrId);
          if (target && target.regionId !== me.regionId) return err("Access denied", 403);
        }
        query.mrId = mrId;
      }
    }

    const date = searchParams.get("date");
    const days = parseInt(searchParams.get("days") || "30");

    if (date) {
      query.date = date;
    } else {
      query.date = { $gte: daysAgo(days) };
    }

    const logs = await Attendance.find(query).sort({ date: -1 });
    return ok(logs.map(serializeDoc));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
