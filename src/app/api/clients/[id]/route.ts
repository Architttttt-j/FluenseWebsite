import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Client } from "@/lib/models";
import { ok, err, serializeDoc, getAuthUserDoc } from "@/lib/utils";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    const client = await Client.findById(params.id);
    if (!client) return err("Client not found", 404);
    if ((me.role === "admin" || me.role === "mr") && client.regionId !== me.regionId)
      return err("Access denied", 403);
    return ok(serializeDoc(client));
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role === "mr") return err("Only admins can delete clients", 403);
    const client = await Client.findByIdAndUpdate(params.id, { status: "inactive" }, { new: true });
    if (!client) return err("Client not found", 404);
    return ok({ message: "Client deactivated" });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
