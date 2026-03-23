import mongoose, { Schema, model, models } from "mongoose";

// ─── Region ─────────────────────────────────────────────────────────────────
const RegionSchema = new Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  headId: { type: String, default: null },
}, { timestamps: true });

export const Region = models.Region || model("Region", RegionSchema);

// ─── User ────────────────────────────────────────────────────────────────────
const UserSchema = new Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ["mr", "admin", "head_admin"], default: "mr" },
  region:       { type: String, default: null },
  regionId:     { type: String, default: null },
  phone:        { type: String, default: null },
  dob:          { type: String, default: null },
  joinDate:     { type: String, default: null },
  status:       { type: String, enum: ["active", "inactive"], default: "active" },
  avatarUrl:    { type: String, default: null },
}, { timestamps: true });

export const User = models.User || model("User", UserSchema);

// ─── Client ──────────────────────────────────────────────────────────────────
const ClientSchema = new Schema({
  name:      { type: String, required: true },
  type:      { type: String, enum: ["doctor", "retailer", "stockist"], required: true },
  region:    { type: String, required: true },
  regionId:  { type: String, required: true },
  specialty: { type: String, default: null },
  address:   { type: String, default: null },
  phone:     { type: String, default: null },
  lat:       { type: Number, default: null },
  lng:       { type: Number, default: null },
  status:    { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

export const Client = models.Client || model("Client", ClientSchema);

// ─── AttendanceLog ────────────────────────────────────────────────────────────
const GeoPointSchema = new Schema({ lat: Number, lng: Number }, { _id: false });

const AttendanceSchema = new Schema({
  mrId:              { type: String, required: true },
  date:              { type: String, required: true }, // YYYY-MM-DD
  checkIn:           { type: String, default: null },
  checkOut:          { type: String, default: null },
  checkInLocation:   { type: GeoPointSchema, default: null },
  checkOutLocation:  { type: GeoPointSchema, default: null },
  status:            { type: String, enum: ["present", "absent", "half_day"], default: "present" },
}, { timestamps: true });

AttendanceSchema.index({ mrId: 1, date: 1 }, { unique: true });
export const Attendance = models.Attendance || model("Attendance", AttendanceSchema);

// ─── VisitLog ─────────────────────────────────────────────────────────────────
const VisitSchema = new Schema({
  mrId:             { type: String, required: true },
  clientId:         { type: String, required: true },
  date:             { type: String, required: true },
  checkIn:          { type: String, default: null },
  checkOut:         { type: String, default: null },
  checkInLocation:  { type: GeoPointSchema, default: null },
  checkOutLocation: { type: GeoPointSchema, default: null },
  products:         [{ type: String }],
  notes:            { type: String, default: null },
}, { timestamps: true });

VisitSchema.index({ mrId: 1, date: 1 });
export const Visit = models.Visit || model("Visit", VisitSchema);

// ─── DailyGoal ────────────────────────────────────────────────────────────────
const GoalSchema = new Schema({
  mrId:        { type: String, required: true },
  date:        { type: String, required: true },
  target:      { type: Number, required: true },
  achieved:    { type: Number, default: 0 },
  description: { type: String, default: null },
}, { timestamps: true });

export const Goal = models.Goal || model("Goal", GoalSchema);
