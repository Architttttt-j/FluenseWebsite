import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Client, Visit } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc, parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const query: Record<string, any> = { status: "active" };
    const baseRegionQuery: Record<string, any> = { status: "active" };

    if (me.role === "admin" || me.role === "mr") {
      query.regionId = me.regionId;
      baseRegionQuery.regionId = me.regionId;
    } else {
      const regionId = searchParams.get("regionId");
      if (regionId) {
        query.regionId = regionId;
        baseRegionQuery.regionId = regionId;
      }
    }

    const type = searchParams.get("type");
    if (type) query.type = type;

    const search = searchParams.get("search");
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
      ];
    }

    const month = searchParams.get("month");
    const { page, limit, skip, hasPagination } = parsePagination(searchParams, 15, 200);

    // Territory counts for doctors, retailers, stockists (fast indexed aggregation)
    const typeCountsAgg = await Client.aggregate([
      { $match: baseRegionQuery },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    const counts = { doctor: 0, retailer: 0, stockist: 0, total: 0 };
    for (const item of typeCountsAgg) {
      if (item._id in counts) {
        counts[item._id as "doctor" | "retailer" | "stockist"] = item.count;
      }
      counts.total += item.count;
    }

    let clients: any[];
    let total = 0;

    if (hasPagination) {
      [total, clients] = await Promise.all([
        Client.countDocuments(query),
        Client.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      ]);
    } else {
      clients = await Client.find(query).sort({ name: 1 }).limit(limit).lean();
      total = clients.length;
    }

    // Attach visit statistics only for the returned slice of clients
    const clientIds = clients.map((c: any) => c._id.toString());
    const visits = clientIds.length
      ? await Visit.find(
          { clientId: { $in: clientIds } },
          { clientId: 1, date: 1 }
        ).sort({ date: -1 }).lean()
      : [];

    const visitsByClient = new Map<string, { count: number; lastVisit: string | null }>();
    for (const v of visits as any[]) {
      const cId = String(v.clientId);
      if (!visitsByClient.has(cId)) {
        visitsByClient.set(cId, { count: 0, lastVisit: v.date || null });
      }
      const entry = visitsByClient.get(cId)!;
      if (month && v.date && v.date.startsWith(month)) {
        entry.count++;
      }
      if (!entry.lastVisit || (v.date && v.date > entry.lastVisit)) {
        entry.lastVisit = v.date;
      }
    }

    const serialized = clients.map((c: any) => {
      const doc = serializeDoc(c);
      const vInfo = visitsByClient.get(doc.id);
      doc.monthVisitsCount = vInfo ? vInfo.count : 0;
      doc.lastVisitDate = vInfo ? vInfo.lastVisit : null;
      return doc;
    });

    if (hasPagination) {
      return ok({
        clients: serialized,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
        counts,
      });
    }

    return ok(serialized);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("Only admins can add clients", 403);

    const body = await req.json();
    const client = await Client.create(body);
    return ok(serializeDoc(client), 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
