import { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/lib/models";
import { err, getAuthUserDoc, ok, serializeDoc } from "@/lib/utils";

type Context = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Context) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "head_admin") return err("Only the head admin can manage products", 403);

    const file = (await req.formData()).get("file") as File;
    if (!file) return err("No PDF provided");
    if (file.type !== "application/pdf") return err("Only PDF brochures are allowed");
    if (file.size > 10 * 1024 * 1024) return err("Brochure is too large. Maximum size is 10MB.");

    const product = await Product.findById(params.id);
    if (!product) return err("Product not found", 404);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "brochures");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${params.id}_${Date.now()}.pdf`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

    product.brochureUrl = `/uploads/brochures/${filename}`;
    await product.save();
    return ok(serializeDoc(product));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
