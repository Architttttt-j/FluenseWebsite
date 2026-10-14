import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User } from "@/lib/models";
import { ok, err, getAuthUserDoc, daysAgo, today } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "14");

    let mrIds: string[] = [];
    if (me.role === "mr") {
      mrIds = [me._id.toString()];
    } else if (me.role === "admin") {
      const mrs = await User.find({ regionId: me.regionId, role: "mr" }).select("_id").lean();
      mrIds = mrs.map((u: any) => u._id.toString());
    } else {
      const regionId = searchParams.get("regionId");
      const mrId = searchParams.get("mrId");
      if (mrId) mrIds = [mrId];
      else if (regionId) {
        const mrs = await User.find({ regionId, role: "mr" }).select("_id").lean();
        mrIds = mrs.map((u: any) => u._id.toString());
      } else {
        const mrs = await User.find({ role: "mr" }).select("_id").lean();
        mrIds = mrs.map((u: any) => u._id.toString());
      }
    }

    const counts: Record<string, number> = {};
    if (mrIds.length > 0) {
      const cutoff = daysAgo(days);
      const visitAgg = await Visit.aggregate([
        {
          $match: {
            mrId: { $in: mrIds },
            date: { $gte: cutoff },
          },
        },
        {
          $group: {
            _id: "$date",
            count: { $sum: 1 },
          },
        },
      ]);
      for (const v of visitAgg) counts[v._id] = v.count;
    }

    // Build full date range with zeros
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, visits: counts[dateStr] || 0 });
    }

    return ok(result);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
