import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User, Client, Region } from "@/lib/models";
import { ok, err, getAuthUserDoc, periodRange } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const range = periodRange(period);

    let mrIds: string[] = [];
    if (me.role === "mr") {
      mrIds = [me._id.toString()];
    } else if (me.role === "admin") {
      const mrs = await User.find({ regionId: me.regionId, role: "mr" }).select("_id").lean();
      mrIds = mrs.map((u: any) => u._id.toString());
    } else {
      const regionId = searchParams.get("regionId");
      const query: any = { role: "mr" };
      if (regionId) query.regionId = regionId;
      const mrs = await User.find(query).select("_id").lean();
      mrIds = mrs.map((u: any) => u._id.toString());
    }

    if (!mrIds.length) {
      return ok({ overall: {}, byClientType: { doctor: {}, retailer: {}, stockist: {} } });
    }

    const visits = await Visit.find(
      { mrId: { $in: mrIds }, date: { $gte: range.start, $lte: range.end } },
      { clientId: 1, products: 1 }
    ).lean();

    const overall: Record<string, number> = {};
    const byType: Record<string, Record<string, number>> = {
      doctor: {}, retailer: {}, stockist: {},
    };

    if (!visits.length) {
      return ok({ overall, byClientType: byType });
    }

    // Only fetch clients that were actually visited, projecting only `type`
    const clientIds = Array.from(new Set(visits.map((v: any) => v.clientId).filter(Boolean)));
    const clients = clientIds.length
      ? await Client.find({ _id: { $in: clientIds } }, { type: 1 }).lean()
      : [];

    const clientMap: Record<string, string> = {};
    for (const c of clients) clientMap[(c as any)._id.toString()] = (c as any).type;

    for (const v of visits as any[]) {
      const type = clientMap[v.clientId] || "unknown";
      for (const pid of v.products || []) {
        overall[pid] = (overall[pid] || 0) + 1;
        if (byType[type]) byType[type][pid] = (byType[type][pid] || 0) + 1;
      }
    }

    return ok({ overall, byClientType: byType });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
