import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User, Client, Region } from "@/lib/models";
import { ok, err, getAuthUserDoc, daysAgo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const days = period === "week" ? 7 : period === "year" ? 365 : 30;
    const cutoff = daysAgo(days);

    let mrIds: string[] = [];
    if (me.role === "mr") {
      mrIds = [me._id.toString()];
    } else if (me.role === "admin") {
      const mrs = await User.find({ regionId: me.regionId, role: "mr" });
      mrIds = mrs.map((u: any) => u._id.toString());
    } else {
      const regionId = searchParams.get("regionId");
      const query: any = { role: "mr" };
      if (regionId) query.regionId = regionId;
      const mrs = await User.find(query);
      mrIds = mrs.map((u: any) => u._id.toString());
    }

    const visits = await Visit.find({ mrId: { $in: mrIds }, date: { $gte: cutoff } });
    const clients = await Client.find({});
    const clientMap: Record<string, string> = {};
    for (const c of clients) clientMap[(c as any)._id.toString()] = (c as any).type;

    const overall: Record<string, number> = {};
    const byType: Record<string, Record<string, number>> = {
      doctor: {}, retailer: {}, stockist: {},
    };

    for (const v of visits) {
      const type = clientMap[v.clientId] || "unknown";
      for (const pid of v.products) {
        overall[pid] = (overall[pid] || 0) + 1;
        if (byType[type]) byType[type][pid] = (byType[type][pid] || 0) + 1;
      }
    }

    return ok({ overall, byClientType: byType });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
