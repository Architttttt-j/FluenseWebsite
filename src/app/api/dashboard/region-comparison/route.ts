import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User, Region } from "@/lib/models";
import { ok, err, getAuthUserDoc, periodRange } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "head_admin") return ok([]);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const range = periodRange(period);

    const regions = await Region.find({}).select("_id name").lean();
    if (!regions.length) return ok([]);

    const mrs = await User.find({ role: "mr" }).select("_id regionId").lean();
    const mrRegionMap = new Map<string, string>();
    const regionMrCounts = new Map<string, number>();

    for (const mr of mrs as any[]) {
      if (mr.regionId) {
        const rId = String(mr.regionId);
        mrRegionMap.set(mr._id.toString(), rId);
        regionMrCounts.set(rId, (regionMrCounts.get(rId) || 0) + 1);
      }
    }

    const allMrIds = (mrs as any[]).map((u: any) => u._id.toString());
    const visitCounts = allMrIds.length
      ? await Visit.aggregate([
          { $match: { mrId: { $in: allMrIds }, date: { $gte: range.start, $lte: range.end } } },
          { $group: { _id: "$mrId", visits: { $sum: 1 } } },
        ])
      : [];

    const regionVisitCounts = new Map<string, number>();
    for (const v of visitCounts) {
      const rId = mrRegionMap.get(String(v._id));
      if (rId) {
        regionVisitCounts.set(rId, (regionVisitCounts.get(rId) || 0) + v.visits);
      }
    }

    const results = regions.map((r: any) => {
      const idStr = r._id.toString();
      return {
        region: r.name,
        regionId: idStr,
        visits: regionVisitCounts.get(idStr) || 0,
        mrCount: regionMrCounts.get(idStr) || 0,
      };
    });

    return ok(results);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
