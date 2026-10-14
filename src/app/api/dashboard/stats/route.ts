import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, Attendance, User } from "@/lib/models";
import { ok, err, getAuthUserDoc, today, daysAgo, periodRange } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const targetMrId = searchParams.get("mrId");
    const reportRange = periodRange(searchParams.get("period") || "month");

    let mrIds: string[] = [];
    if (targetMrId) {
      const target = await User.findById(targetMrId).select("_id role regionId").lean();
      if (!target || (target as any).role !== "mr") return err("MR not found", 404);
      if (me.role === "mr" && (target as any)._id.toString() !== me._id.toString()) return err("Unauthorized", 403);
      if (me.role === "admin" && (target as any).regionId !== me.regionId) return err("Unauthorized", 403);
      mrIds = [targetMrId];
    } else if (me.role === "mr") {
      mrIds = [me._id.toString()];
    } else if (me.role === "admin") {
      const mrs = await User.find({ regionId: me.regionId, role: "mr", status: "active" }).select("_id").lean();
      mrIds = mrs.map((u: any) => u._id.toString());
    } else {
      const regionId = searchParams.get("regionId");
      const query: any = { role: "mr", status: "active" };
      if (regionId) query.regionId = regionId;
      const mrs = await User.find(query).select("_id").lean();
      mrIds = mrs.map((u: any) => u._id.toString());
    }

    if (mrIds.length === 0) {
      return ok({
        totalMrs: 0,
        presentToday: 0,
        visitsToday: 0,
        visitsThisWeek: 0,
        visitsThisMonth: 0,
        visitsInPeriod: 0,
        avgVisitsPerMr: 0,
      });
    }

    const todayStr = today();
    const weekCutoff = daysAgo(7);
    const monthCutoff = daysAgo(30);

    const [presentToday, visitsToday, visitsWeek, visitsMonth, visitsInPeriod] = await Promise.all([
      Attendance.countDocuments({ mrId: { $in: mrIds }, date: todayStr }),
      Visit.countDocuments({ mrId: { $in: mrIds }, date: todayStr }),
      Visit.countDocuments({ mrId: { $in: mrIds }, date: { $gte: weekCutoff } }),
      Visit.countDocuments({ mrId: { $in: mrIds }, date: { $gte: monthCutoff } }),
      Visit.countDocuments({ mrId: { $in: mrIds }, date: { $gte: reportRange.start, $lte: reportRange.end } }),
    ]);

    return ok({
      totalMrs: mrIds.length,
      presentToday,
      visitsToday,
      visitsThisWeek: visitsWeek,
      visitsThisMonth: visitsMonth,
      visitsInPeriod,
      avgVisitsPerMr: mrIds.length > 0 ? +(visitsInPeriod / mrIds.length).toFixed(1) : 0,
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
