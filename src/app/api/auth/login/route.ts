import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { verifyPassword, signToken } from "@/lib/auth";
import { ok, err, serializeUser } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    if (!email || !password) return err("Email and password required");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return err("Invalid email or password", 401);
    if (user.status !== "active") return err("Account is inactive. Contact your admin.", 403);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return err("Invalid email or password", 401);

    const token = await signToken({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return ok({ access_token: token, token_type: "bearer", user: serializeUser(user) });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
