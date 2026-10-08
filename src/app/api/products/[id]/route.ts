import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/lib/models";
import { err, getAuthUserDoc, ok, serializeDoc } from "@/lib/utils";

type Context = { params: { id: string } };

async function requireHeadAdmin(req: NextRequest) {
  const me = await getAuthUserDoc(req);
  if (!me) return err("Unauthorized", 401);
  if (me.role !== "head_admin") return err("Only the head admin can manage products", 403);
  return null;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    await connectDB();
    const denied = await requireHeadAdmin(req);
    if (denied) return denied;

    const body = await req.json();
    const updates: Record<string, string> = {};
    for (const field of ["code", "name", "description", "brochureUrl"]) {
      if (field in body) updates[field] = String(body[field] || "").trim();
    }
    if (updates.code === "" || updates.name === "") return err("code and name cannot be empty");

    const product = await Product.findByIdAndUpdate(params.id, updates, { new: true, runValidators: true });
    if (!product) return err("Product not found", 404);
    return ok(serializeDoc(product));
  } catch (e: any) {
    if (e.code === 11000) return err("Product code already exists", 409);
    return err(e.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    await connectDB();
    const denied = await requireHeadAdmin(req);
    if (denied) return denied;

    const product = await Product.findByIdAndDelete(params.id);
    if (!product) return err("Product not found", 404);
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return err(e.message, 500);
  }
}