import { NextRequest } from "next/server";
import { getAuthUserDoc } from "@/lib/utils";
import { ok, err, serializeUser } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getAuthUserDoc(req);
  if (!user) return err("Unauthorized", 401);
  return ok(serializeUser(user));
}
