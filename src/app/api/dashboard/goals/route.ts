import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Goal, User } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc, today } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || today();
    const query: Record<string, any> = { date };

    if (me.role === "mr") query.mrId = me._id.toString();
    else {
      const mrId = searchParams.get("mrId");
      const userQuery: Record<string, any> = { role: "mr" };
      if (me.role === "admin") userQuery.regionId = me.regionId;
      if (me.role === "head_admin" && searchParams.get("regionId")) userQuery.regionId = searchParams.get("regionId");
      if (mrId) userQuery._id = mrId;
      const allowedMrs = await User.find(userQuery).select("_id").lean();
      query.mrId = { $in: allowedMrs.map((user: any) => user._id.toString()) };
    }

    const goals = await Goal.find(query);
    return ok(goals.map(serializeDoc));
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("Only admins can assign goals", 403);

    const body = await req.json();
    const { mrId, date, target, description } = body;
    if (!mrId || !date || target === undefined || target === null || target === "") {
      return err("mrId, date and target are required");
    }

    const numericTarget = Number(target);
    if (!Number.isFinite(numericTarget) || numericTarget < 0) return err("target must be a non-negative number");

    const userQuery: Record<string, any> = { _id: mrId, role: "mr" };
    if (me.role === "admin") userQuery.regionId = me.regionId;
    const mr = await User.findOne(userQuery).select("_id").lean();
    if (!mr) return err("MR not found or access denied", 403);

    const goal = await Goal.findOneAndUpdate(
      { mrId, date },
      { mrId, date, target: numericTarget, description: description || null },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return ok(serializeDoc(goal), 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
