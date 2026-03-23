// scripts/seed.mjs
// Run with: node scripts/seed.mjs

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fluense_db";

// ── Schemas (inline for the script) ─────────────────────────────────────────
const GeoPoint = new mongoose.Schema({ lat: Number, lng: Number }, { _id: false });

const RegionSchema = new mongoose.Schema({ name: String, city: String, headId: String }, { timestamps: true });
const UserSchema = new mongoose.Schema({ name: String, email: String, passwordHash: String, role: String, region: String, regionId: String, phone: String, dob: String, joinDate: String, status: String, avatarUrl: String }, { timestamps: true });
const ClientSchema = new mongoose.Schema({ name: String, type: String, region: String, regionId: String, specialty: String, address: String, phone: String, lat: Number, lng: Number, status: { type: String, default: "active" } }, { timestamps: true });
const AttendanceSchema = new mongoose.Schema({ mrId: String, date: String, checkIn: String, checkOut: String, checkInLocation: GeoPoint, checkOutLocation: GeoPoint, status: String }, { timestamps: true });
const VisitSchema = new mongoose.Schema({ mrId: String, clientId: String, date: String, checkIn: String, checkOut: String, products: [String], notes: String }, { timestamps: true });
const GoalSchema = new mongoose.Schema({ mrId: String, date: String, target: Number, achieved: Number, description: String }, { timestamps: true });

const Region   = mongoose.model("Region",     RegionSchema);
const User     = mongoose.model("User",       UserSchema);
const Client   = mongoose.model("Client",     ClientSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);
const Visit    = mongoose.model("Visit",      VisitSchema);
const Goal     = mongoose.model("Goal",       GoalSchema);

// ── Seed Data ────────────────────────────────────────────────────────────────
const REGIONS = [
  { name: "Baner",      city: "Pune" },
  { name: "Kothrud",    city: "Pune" },
  { name: "Wakad",      city: "Pune" },
  { name: "Hinjewadi",  city: "Pune" },
];

const USERS = [
  { name: "Rajesh Mehta",     email: "rajesh.mehta@fluense.com",     password: "admin123", role: "head_admin", regionKey: null,       dob: "1978-04-12", phone: "+91 98201 11001", joinDate: "2019-01-10" },
  { name: "Sneha Kulkarni",   email: "sneha.kulkarni@fluense.com",   password: "admin123", role: "admin",      regionKey: "Baner",     dob: "1985-07-23", phone: "+91 98201 11002", joinDate: "2020-03-15" },
  { name: "Amit Joshi",       email: "amit.joshi@fluense.com",       password: "admin123", role: "admin",      regionKey: "Kothrud",   dob: "1983-11-05", phone: "+91 98201 11003", joinDate: "2020-06-01" },
  { name: "Priya Desai",      email: "priya.desai@fluense.com",      password: "admin123", role: "admin",      regionKey: "Wakad",     dob: "1987-02-19", phone: "+91 98201 11004", joinDate: "2021-01-10" },
  { name: "Arjun Patil",      email: "arjun.patil@fluense.com",      password: "mr123",    role: "mr",         regionKey: "Baner",     dob: "1994-08-30", phone: "+91 99201 22001", joinDate: "2022-02-14" },
  { name: "Kavya Sharma",     email: "kavya.sharma@fluense.com",     password: "mr123",    role: "mr",         regionKey: "Baner",     dob: "1996-03-15", phone: "+91 99201 22002", joinDate: "2022-05-20" },
  { name: "Rohit Nair",       email: "rohit.nair@fluense.com",       password: "mr123",    role: "mr",         regionKey: "Baner",     dob: "1993-12-08", phone: "+91 99201 22003", joinDate: "2021-08-01", status: "inactive" },
  { name: "Deepika Rao",      email: "deepika.rao@fluense.com",      password: "mr123",    role: "mr",         regionKey: "Kothrud",   dob: "1995-06-22", phone: "+91 99201 22004", joinDate: "2022-09-12" },
  { name: "Siddharth More",   email: "siddharth.more@fluense.com",   password: "mr123",    role: "mr",         regionKey: "Kothrud",   dob: "1992-01-17", phone: "+91 99201 22005", joinDate: "2021-11-03" },
  { name: "Neha Bhat",        email: "neha.bhat@fluense.com",        password: "mr123",    role: "mr",         regionKey: "Wakad",     dob: "1997-09-04", phone: "+91 99201 22006", joinDate: "2023-01-16" },
  { name: "Vikram Singh",     email: "vikram.singh@fluense.com",     password: "mr123",    role: "mr",         regionKey: "Wakad",     dob: "1991-04-28", phone: "+91 99201 22007", joinDate: "2022-07-22" },
  { name: "Pooja Iyer",       email: "pooja.iyer@fluense.com",       password: "mr123",    role: "mr",         regionKey: "Hinjewadi", dob: "1996-11-11", phone: "+91 99201 22008", joinDate: "2023-03-05" },
];

const CLIENTS = [
  { name: "Dr. Ananya Kapoor",  type: "doctor",   regionKey: "Baner",     specialty: "General Physician",  address: "Shop 12, Baner Rd",        lat: 18.5642, lng: 73.7769, phone: "+91 98765 10001" },
  { name: "Dr. Suresh Pillai",  type: "doctor",   regionKey: "Baner",     specialty: "Cardiologist",       address: "Baner Hills Clinic",       lat: 18.5612, lng: 73.7792, phone: "+91 98765 10002" },
  { name: "Dr. Meena Jain",     type: "doctor",   regionKey: "Baner",     specialty: "Diabetologist",      address: "Panchshil Tower, Baner",   lat: 18.5658, lng: 73.7743, phone: "+91 98765 10003" },
  { name: "Dr. Kiran Wagh",     type: "doctor",   regionKey: "Baner",     specialty: "Pulmonologist",      address: "Baner Market, Pune",       lat: 18.5631, lng: 73.7801, phone: "+91 98765 10004" },
  { name: "Sai Medical Store",  type: "retailer", regionKey: "Baner",     address: "Baner Rd, Near D-Mart",                                     lat: 18.5620, lng: 73.7755, phone: "+91 98765 10005" },
  { name: "Wellness Pharmacy",  type: "retailer", regionKey: "Baner",     address: "7 Baner Galli",                                             lat: 18.5647, lng: 73.7780, phone: "+91 98765 10006" },
  { name: "Apollo Pharmacy",    type: "retailer", regionKey: "Baner",     address: "Survey No 8, Baner",                                        lat: 18.5605, lng: 73.7762, phone: "+91 98765 10007" },
  { name: "Pharma Hub Baner",   type: "stockist", regionKey: "Baner",     address: "Anand Nagar, Baner",                                        lat: 18.5638, lng: 73.7740, phone: "+91 98765 10008" },
  { name: "MediStock Ent.",     type: "stockist", regionKey: "Baner",     address: "Baner MIDC, Pune",                                          lat: 18.5618, lng: 73.7726, phone: "+91 98765 10009" },
  { name: "Dr. Pramod Ghate",   type: "doctor",   regionKey: "Kothrud",   specialty: "Orthopedic",         address: "Paud Rd, Kothrud",         lat: 18.5074, lng: 73.8077, phone: "+91 98765 20001" },
  { name: "Dr. Sunita Rane",    type: "doctor",   regionKey: "Kothrud",   specialty: "General Physician",  address: "Kothrud Colony",           lat: 18.5042, lng: 73.8092, phone: "+91 98765 20002" },
  { name: "Dr. Nilesh Bodke",   type: "doctor",   regionKey: "Kothrud",   specialty: "Gastroenterologist", address: "Vanaz Corner, Kothrud",    lat: 18.5018, lng: 73.8065, phone: "+91 98765 20003" },
  { name: "Medico Plus",        type: "retailer", regionKey: "Kothrud",   address: "DP Rd, Kothrud",                                            lat: 18.5058, lng: 73.8080, phone: "+91 98765 20004" },
  { name: "CureZone Pharmacy",  type: "retailer", regionKey: "Kothrud",   address: "Kothrud Market",                                            lat: 18.5031, lng: 73.8055, phone: "+91 98765 20005" },
  { name: "Central Pharma",     type: "stockist", regionKey: "Kothrud",   address: "Ideal Colony, Kothrud",                                     lat: 18.5012, lng: 73.8041, phone: "+91 98765 20006" },
  { name: "Dr. Rashmi Thakur",  type: "doctor",   regionKey: "Wakad",     specialty: "Pediatrician",       address: "Wakad Main Rd",            lat: 18.5994, lng: 73.7607, phone: "+91 98765 30001" },
  { name: "HealthFirst Pharma", type: "retailer", regionKey: "Wakad",     address: "Wakad Chowk",                                               lat: 18.5978, lng: 73.7622, phone: "+91 98765 30002" },
  { name: "Wakad Medi Depot",   type: "stockist", regionKey: "Wakad",     address: "Phase 1, Wakad",                                            lat: 18.5961, lng: 73.7638, phone: "+91 98765 30003" },
  { name: "Dr. Ajay Kulkarni",  type: "doctor",   regionKey: "Hinjewadi", specialty: "General Physician",  address: "Phase 2, Hinjewadi",       lat: 18.5910, lng: 73.7390, phone: "+91 98765 40001" },
  { name: "LifeCare Pharmacy",  type: "retailer", regionKey: "Hinjewadi", address: "Phase 1, Hinjewadi",                                        lat: 18.5892, lng: 73.7365, phone: "+91 98765 40002" },
  { name: "Hinjewadi Pharma",   type: "stockist", regionKey: "Hinjewadi", address: "IT Park Rd, Hinjewadi",                                     lat: 18.5875, lng: 73.7342, phone: "+91 98765 40003" },
];

const PRODUCTS = ["p001","p002","p003","p004","p005","p006","p007","p008"];

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log("Database already seeded. Skipping. (Drop the DB to re-seed)");
    await mongoose.disconnect();
    return;
  }

  // Regions
  const regionMap = {};
  for (const r of REGIONS) {
    const doc = await Region.create(r);
    regionMap[r.name] = doc._id.toString();
  }
  console.log(`✓ ${REGIONS.length} regions`);

  // Users
  const userMap = {};
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const regionId = u.regionKey ? regionMap[u.regionKey] : null;
    const doc = await User.create({
      name: u.name, email: u.email, passwordHash,
      role: u.role, region: u.regionKey || "Pune HQ",
      regionId, phone: u.phone, dob: u.dob,
      joinDate: u.joinDate, status: u.status || "active",
    });
    userMap[u.email] = { id: doc._id.toString(), regionKey: u.regionKey, role: u.role };
  }
  console.log(`✓ ${USERS.length} users`);

  // Clients
  const clientsByRegion = {};
  for (const c of CLIENTS) {
    const regionId = regionMap[c.regionKey];
    const doc = await Client.create({ ...c, region: c.regionKey, regionId, specialty: c.specialty || null });
    if (!clientsByRegion[c.regionKey]) clientsByRegion[c.regionKey] = [];
    clientsByRegion[c.regionKey].push(doc._id.toString());
  }
  console.log(`✓ ${CLIENTS.length} clients`);

  // MRs grouped by region
  const mrsByRegion = {};
  for (const [email, info] of Object.entries(userMap)) {
    if (info.role === "mr" && info.regionKey) {
      const u = USERS.find(u => u.email === email);
      if (u?.status === "inactive") continue;
      if (!mrsByRegion[info.regionKey]) mrsByRegion[info.regionKey] = [];
      mrsByRegion[info.regionKey].push(info.id);
    }
  }

  // Attendance + Visits for 30 days
  let attCount = 0, visitCount = 0;
  for (const [regionKey, mrIds] of Object.entries(mrsByRegion)) {
    const regionClients = clientsByRegion[regionKey] || [];
    for (const mrId of mrIds) {
      for (let i = 30; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const ds = date.toISOString().split("T")[0];

        // Attendance
        const hIn = randInt(8, 9), mIn = randInt(0, 59);
        const hOut = randInt(17, 18), mOut = randInt(0, 59);
        await Attendance.create({
          mrId, date: ds,
          checkIn:  `${String(hIn).padStart(2,"0")}:${String(mIn).padStart(2,"0")}`,
          checkOut: i > 0 ? `${String(hOut).padStart(2,"0")}:${String(mOut).padStart(2,"0")}` : null,
          checkInLocation:  { lat: 18.56 + (Math.random()-0.5)*0.04, lng: 73.77 + (Math.random()-0.5)*0.04 },
          checkOutLocation: i > 0 ? { lat: 18.56 + (Math.random()-0.5)*0.04, lng: 73.77 + (Math.random()-0.5)*0.04 } : null,
          status: "present",
        });
        attCount++;

        // Visits
        if (regionClients.length > 0) {
          const visited = pick(regionClients, Math.min(randInt(3, 6), regionClients.length));
          for (let v = 0; v < visited.length; v++) {
            const hV = 9 + v, mV = randInt(0, 59);
            await Visit.create({
              mrId, clientId: visited[v], date: ds,
              checkIn:  `${String(hV).padStart(2,"0")}:${String(mV).padStart(2,"0")}`,
              checkOut: `${String(hV).padStart(2,"0")}:${String((mV + randInt(20,45)) % 60).padStart(2,"0")}`,
              products: pick(PRODUCTS, randInt(1, 3)),
              notes: "Discussed product benefits and availability.",
            });
            visitCount++;
          }
        }
      }
    }
  }
  console.log(`✓ ${attCount} attendance logs`);
  console.log(`✓ ${visitCount} visit logs`);

  // Goals for today
  const todayStr = new Date().toISOString().split("T")[0];
  const allMrIds = Object.values(mrsByRegion).flat();
  for (const mrId of allMrIds) {
    const target = randInt(5, 9);
    await Goal.create({ mrId, date: todayStr, target, achieved: randInt(2, target), description: `Visit ${target} clients today` });
  }
  console.log(`✓ ${allMrIds.length} daily goals`);

  console.log("\n🎉 Seed complete!");
  console.log("\nDemo logins:");
  console.log("  Head Admin : rajesh.mehta@fluense.com   / admin123");
  console.log("  Admin      : sneha.kulkarni@fluense.com / admin123");
  console.log("  MR         : arjun.patil@fluense.com    / mr123");

  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
