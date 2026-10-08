import { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/lib/models";
import { err, getAuthUserDoc, ok, serializeDoc } from "@/lib/utils";

type Context = { params: { id: string } };

const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest, { params }: Context) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me.role !== "head_admin") return err("Only the head admin can manage products", 403);

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") return err("No image provided");

    const extension = imageTypes[file.type];
    if (!extension) return err("Invalid image type. Use JPG, PNG or WebP.");
    if (file.size === 0) return err("The selected image is empty.");
    if (file.size > 5 * 1024 * 1024) return err("Image is too large. Maximum size is 5MB.");

    const product = await Product.findById(params.id);
    if (!product) return err("Product not found", 404);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${params.id}_${Date.now()}.${extension}`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

    product.imageUrl = `/uploads/products/${filename}`;
    await product.save();
    return ok(serializeDoc(product));
  } catch (e: any) {
    console.error(e);
    return err(e.message || "Unable to upload product image", 500);
  }
}
