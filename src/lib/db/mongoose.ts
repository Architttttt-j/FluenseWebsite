import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) throw new Error("MONGODB_URI not defined in .env.local");

// Global cache to prevent multiple connections in dev (hot reload)
declare global {
  var _mongooseConn: typeof mongoose | null;
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

let cached = global._mongooseConn;
let promise = global._mongoosePromise;

export async function connectDB() {
  if (cached) return cached;

  if (!promise) {
    promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached = await promise;
  global._mongooseConn = cached;
  global._mongoosePromise = promise;
  return cached;
}
