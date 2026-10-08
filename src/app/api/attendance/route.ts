import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Attendance, User, Visit, Client, Product } from "@/lib/models";
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
          if (!target || target.role !== "mr" || target.regionId !== me.regionId) return err("Access denied", 403);
        }
        query.mrId = mrId;
      } else if (me.role === "admin") {
        const regionMrs = await User.find({ regionId: me.regionId, role: "mr" }).select("_id").lean();
        query.mrId = { $in: regionMrs.map((mr: any) => mr._id.toString()) };
      }
    }

    const date = searchParams.get("date");
    const rawDays = searchParams.get("days");

    if (date) {
      query.date = date;
    } else if (rawDays) {
      const days = parseInt(rawDays, 10);
      if (!Number.isNaN(days) && days > 0) {
        query.date = { $gte: daysAgo(days) };
      }
    }

    const logs = await Attendance.find(query).sort({ date: -1 }).lean();
    const mrIds = Array.from(new Set(logs.map((log: any) => log.mrId).filter(Boolean)));
    const mrs = mrIds.length ? await User.find({ _id: { $in: mrIds } }).select("name").lean() : [];
    const mrNames = mrs.reduce((map: Record<string, string>, mr: any) => {
      map[mr._id.toString()] = mr.name;
      return map;
    }, {});
    const visitKeys = logs.map((log: any) => ({ mrId: log.mrId, date: log.date }));
    const visits = visitKeys.length ? await Visit.find({ $or: visitKeys }).lean() : [];
    const clientIds = Array.from(new Set(visits.map((visit: any) => visit.clientId)));
    const clients = clientIds.length ? await Client.find({ _id: { $in: clientIds } }).lean() : [];
    const productCodes = Array.from(new Set(visits.flatMap((visit: any) => visit.products || [])));
    const products = productCodes.length ? await Product.find({ code: { $in: productCodes } }).lean() : [];
    const clientMap = clients.reduce((map: Record<string, any>, client: any) => {
      map[client._id.toString()] = { name: client.name, type: client.type };
      return map;
    }, {});
    const productMap = products.reduce((map: Record<string, string>, product: any) => {
      map[product.code] = product.name;
      return map;
    }, {});
    const visitsByAttendance = visits.reduce((map: Record<string, any[]>, visit: any) => {
      const key = `${visit.mrId}:${visit.date}`;
      if (!map[key]) map[key] = [];
      const client = clientMap[visit.clientId];
      if (client) {
        map[key].push({
          ...client,
          products: (visit.products || []).map((code: string) => productMap[code] || code),
        });
      }
      return map;
    }, {});

    return ok(logs.map((log: any) => ({
      ...serializeDoc(log),
      mrName: mrNames[log.mrId] || null,
      visitedClients: visitsByAttendance[`${log.mrId}:${log.date}`] || [],
    })));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
