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

    const mrs = await User.find(query);

    const results = await Promise.all(
      mrs.map(async (mr: any) => {
        const visits = await Visit.countDocuments({
          mrId: mr._id.toString(),
          date: { $gte: range.start, $lte: range.end },
        });
        return {
          id: mr._id.toString(),
          name: mr.name,
          firstName: mr.name.split(" ")[0],
          region: mr.region,
          status: mr.status,
          visits,
        };
      })
    );

    return ok(results.sort((a, b) => b.visits - a.visits));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
