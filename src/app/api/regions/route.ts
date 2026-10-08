import { connectDB } from "@/lib/db/mongoose";
import { Region } from "@/lib/models";
import { ok, err } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const regions = await Region.find({}).select("name city").sort({ city: 1, name: 1 }).lean();
    return ok(regions.map(region => ({
      id: String(region._id),
      name: region.name,
      city: region.city,
    })));
  } catch (e: any) {
    console.error(e);
    return err(e.message, 500);
  }
}
