import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User } from "@/lib/models";
import { ok, err, getAuthUserDoc, periodRange } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return ok([]);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const range = periodRange(period);

    const query: any = { role: "mr" };
    if (me.role === "admin") query.regionId = me.regionId;
    else if (searchParams.get("regionId")) query.regionId = searchParams.get("regionId");

    const mrs = await User.find(query).select("_id name region status").lean();
    if (!mrs.length) return ok([]);

    const mrIds = mrs.map((mr: any) => mr._id.toString());
    const visitCounts = await Visit.aggregate([
      {
        $match: {
          mrId: { $in: mrIds },
          date: { $gte: range.start, $lte: range.end },
        },
      },
      {
        $group: {
          _id: "$mrId",
          visits: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map<string, number>();
    for (const v of visitCounts) {
      countMap.set(String(v._id), v.visits);
    }

    const results = mrs.map((mr: any) => {
      const idStr = mr._id.toString();
      return {
        id: idStr,
        name: mr.name,
        firstName: mr.name.split(" ")[0],
        region: mr.region,
        status: mr.status,
        visits: countMap.get(idStr) || 0,
      };
    });

    return ok(results.sort((a, b) => b.visits - a.visits));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
