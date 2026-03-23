import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Client } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const query: Record<string, any> = { status: "active" };

    if (me.role === "admin" || me.role === "mr") {
      query.regionId = me.regionId;
    } else {
      const regionId = searchParams.get("regionId");
      if (regionId) query.regionId = regionId;
    }

    const type = searchParams.get("type");
    if (type) query.type = type;

    let clients = await Client.find(query);

    const search = searchParams.get("search");
    if (search) {
      const s = search.toLowerCase();
      clients = clients.filter((c: any) =>
        c.name.toLowerCase().includes(s) ||
        (c.address && c.address.toLowerCase().includes(s))
      );
    }

    return ok(clients.map(serializeDoc));
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
