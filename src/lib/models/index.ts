import mongoose, { Schema, model, models } from "mongoose";

// ─── Region ─────────────────────────────────────────────────────────────────
const RegionSchema = new Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  headId: { type: String, default: null },
}, { timestamps: true });

RegionSchema.index({ name: 1 });
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

UserSchema.index({ role: 1, regionId: 1, status: 1 });
UserSchema.index({ regionId: 1, role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ name: 1 });
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

ClientSchema.index({ regionId: 1, status: 1, type: 1 });
ClientSchema.index({ status: 1, type: 1 });
ClientSchema.index({ name: 1 });
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
AttendanceSchema.index({ date: 1, status: 1 });
AttendanceSchema.index({ mrId: 1, date: -1 });
AttendanceSchema.index({ date: -1 });
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
VisitSchema.index({ mrId: 1, date: -1 });
VisitSchema.index({ clientId: 1, date: -1 });
VisitSchema.index({ date: -1 });
VisitSchema.index({ products: 1 });
export const Visit = models.Visit || model("Visit", VisitSchema);

// ─── DailyGoal ────────────────────────────────────────────────────────────────
const GoalSchema = new Schema({
  mrId:        { type: String, required: true },
  date:        { type: String, required: true },
  target:      { type: Number, required: true },
  achieved:    { type: Number, default: 0 },
  description: { type: String, default: null },
}, { timestamps: true });

GoalSchema.index({ mrId: 1, date: 1 }, { unique: true });
GoalSchema.index({ date: 1 });
export const Goal = models.Goal || model("Goal", GoalSchema);

// ─── Product ────────────────────────────────────────────────────────────────
const ProductSchema = new Schema({
  code:        { type: String, required: true, unique: true, trim: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  imageUrl:    { type: String, default: "" },
  brochureUrl: { type: String, default: "" },
}, { timestamps: true });

ProductSchema.index({ name: 1 });
export const Product = models.Product || model("Product", ProductSchema);
