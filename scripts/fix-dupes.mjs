import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fluense_db";

async function fix() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Current remaining regions (from first seed run)
  const regions = await db.collection("regions").find({}).toArray();
  console.log("Current regions:");
  regions.forEach(r => console.log(" ", r._id.toString(), r.name));

  // Build name -> canonical region ID mapping
  const nameToId = {};
  for (const r of regions) {
    nameToId[r.name] = r._id.toString();
  }

  // Fix users: update regionId based on their region name
  const users = await db.collection("users").find({}).toArray();
  let userFixes = 0;
  for (const u of users) {
    if (u.region && nameToId[u.region] && u.regionId !== nameToId[u.region]) {
      await db.collection("users").updateOne(
        { _id: u._id },
        { $set: { regionId: nameToId[u.region] } }
      );
      console.log(`  Fixed user ${u.name}: ${u.regionId} -> ${nameToId[u.region]}`);
      userFixes++;
    }
  }
  console.log(`Fixed ${userFixes} users`);

  // Fix clients: update regionId based on their region name
  const clients = await db.collection("clients").find({}).toArray();
  let clientFixes = 0;
  for (const c of clients) {
    if (c.region && nameToId[c.region] && c.regionId !== nameToId[c.region]) {
      await db.collection("clients").updateOne(
        { _id: c._id },
        { $set: { regionId: nameToId[c.region] } }
      );
      clientFixes++;
    }
  }
  console.log(`Fixed ${clientFixes} clients`);

  // Verify
  console.log("\nVerification:");
  const updatedUsers = await db.collection("users").find({ role: "mr" }).toArray();
  updatedUsers.forEach(u => console.log(`  ${u.name} -> regionId: ${u.regionId} (${u.region})`));

  await mongoose.disconnect();
  console.log("\n✅ Fix complete!");
}

fix().catch(e => { console.error(e); process.exit(1); });
