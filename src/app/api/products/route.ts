import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/lib/models";
import { err, getAuthUserDoc, ok, serializeDoc } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({})
      .select("code name description imageUrl brochureUrl")
      .sort({ name: 1 })
      .lean();
    return ok(products.map(product => ({
      id: String(product._id),
      code: product.code,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      brochureUrl: product.brochureUrl,
    })));
  } catch (e: any) {
    console.error(e);
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "head_admin") return err("Only the head admin can manage products", 403);

    const body = await req.json();
    const code = String(body.code || "").trim();
    const name = String(body.name || "").trim();
    if (!code || !name) return err("code and name are required");

    const product = await Product.create({
      code,
      name,
      description: String(body.description || "").trim(),
      brochureUrl: String(body.brochureUrl || "").trim(),
    });
    return ok(serializeDoc(product), 201);
  } catch (e: any) {
    if (e.code === 11000) return err("Product code already exists", 409);
    return err(e.message, 500);
  }
}