import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { ok, err, serializeUser, getAuthUserDoc } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const me = await getAuthUserDoc(req);
    if (!me) return err("Unauthorized", 401);
    if (me._id.toString() !== params.id) return err("You can only change your own avatar", 403);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return err("No file provided");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return err("Invalid file type. Use JPG, PNG or WebP.");

    const maxBytes = parseInt(process.env.MAX_FILE_SIZE_MB || "5") * 1024 * 1024;
    if (file.size > maxBytes) return err(`File too large. Max ${process.env.MAX_FILE_SIZE_MB}MB.`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${params.id}_${Date.now()}.jpg`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    const updated = await User.findByIdAndUpdate(params.id, { avatarUrl }, { new: true });
    return ok(serializeUser(updated));
  } catch (e: any) {
    return err(e.message, 500);
  }
}
