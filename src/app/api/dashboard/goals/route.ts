import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Goal } from "@/lib/models";
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
    else if (searchParams.get("mrId")) query.mrId = searchParams.get("mrId");

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
    const goal = await Goal.create(body);
    return ok(serializeDoc(goal), 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
