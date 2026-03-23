import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Visit, User } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc, daysAgo } from "@/lib/utils";

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
          if (target && target.regionId !== me.regionId) return err("Access denied", 403);
        }
        query.mrId = mrId;
      } else if (me.role === "admin") {
        const regionMrs = await User.find({ regionId: me.regionId, role: "mr" });
        query.mrId = { $in: regionMrs.map((u: any) => u._id.toString()) };
      }
    }

    const clientId = searchParams.get("clientId");
    const date = searchParams.get("date");
    const days = parseInt(searchParams.get("days") || "30");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (clientId) query.clientId = clientId;
    if (date) query.date = date;
    else query.date = { $gte: daysAgo(days) };

    const visits = await Visit.find(query).sort({ date: -1 }).limit(limit);
    return ok(visits.map(serializeDoc));
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "mr") return err("Only MRs can log visits", 403);

    const body = await req.json();
    const { clientId, date, checkIn, checkOut, checkInLocation, checkOutLocation, products, notes } = body;
    if (!clientId || !date) return err("clientId and date are required");

    const visit = await Visit.create({
      mrId: me._id.toString(),
      clientId, date, checkIn, checkOut,
      checkInLocation: checkInLocation || null,
      checkOutLocation: checkOutLocation || null,
      products: products || [],
      notes: notes || null,
    });

    return ok(serializeDoc(visit), 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
