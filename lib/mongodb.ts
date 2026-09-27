import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  // Lazy check (inside function, not at module top-level) so `next build`
  // / `next lint` on Vercel/CI succeed without DB env vars. Only API routes
  // that actually call connectDB() require the variable.
  if (!uri || uri.includes("<user>") || uri.includes("<password>")) {
    throw new Error(
      "Missing MONGODB_URI. Copy .env.example to .env.local and fill it in."
    );
  }
  return uri;
}

// Vercel / serverless: reuse the connection across hot invocations.
// Without this cache, every API route invocation opens a new connection
// and quickly exhausts MongoDB Atlas connection limits.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      // Fail fast in serverless instead of buffering commands forever.
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
