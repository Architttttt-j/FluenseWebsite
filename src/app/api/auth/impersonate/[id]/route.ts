import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { signToken } from "@/lib/auth";
import { ok, err, serializeUser, getAuthUserDoc } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const currentUser = await getAuthUserDoc(req);
    if (!currentUser) return err("Unauthorized", 401);

    const target = await User.findById(params.id);
    if (!target) return err("User not found", 404);

    if (currentUser.role === "head_admin") {
      // full access
    } else if (currentUser.role === "admin") {
      if (target.role !== "mr" || target.regionId !== currentUser.regionId)
        return err("Admins can only impersonate MRs in their region", 403);
    } else {
      return err("Only admins can impersonate", 403);
    }

    const token = await signToken({
      sub: target._id.toString(),
      role: target.role,
      email: target.email,
      impersonatedBy: currentUser._id.toString(),
    });

    return ok({ access_token: token, token_type: "bearer", user: serializeUser(target) });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
