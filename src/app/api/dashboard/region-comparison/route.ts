import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User, Region } from "@/lib/models";
import { ok, err, getAuthUserDoc, daysAgo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "head_admin") return ok([]);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const days = period === "week" ? 7 : period === "year" ? 365 : 30;
    const cutoff = daysAgo(days);

    const regions = await Region.find({});
    const results = await Promise.all(
      regions.map(async (r: any) => {
        const mrs = await User.find({ regionId: r._id.toString(), role: "mr" });
        const mrIds = mrs.map((u: any) => u._id.toString());
        const visits = mrIds.length
          ? await Visit.countDocuments({ mrId: { $in: mrIds }, date: { $gte: cutoff } })
          : 0;
        return { region: r.name, regionId: r._id.toString(), visits, mrCount: mrs.length };
      })
    );

    return ok(results);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
