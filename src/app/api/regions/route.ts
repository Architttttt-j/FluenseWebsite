import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Region } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    const regions = await Region.find({});
    return ok(regions.map(serializeDoc));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
