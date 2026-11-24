import "server-only";
import mongoose from "mongoose";

import { getServerEnv } from "@/env";

const SERVER_SELECTION_TIMEOUT_MS = 10_000;

// Request input can never inject query operators.
mongoose.set("sanitizeFilter", true);

interface ConnectionCache {
  connecting?: Promise<typeof mongoose>;
}

// Kept on globalThis so Next.js hot reload does not open a new connection on every edit.
const globalForMongoose = globalThis as typeof globalThis & { oedfMongoose?: ConnectionCache };
const cache: ConnectionCache = (globalForMongoose.oedfMongoose ??= {});

/** Returns the one shared Mongoose connection, opening it on first use. */
export function connectDb(): Promise<typeof mongoose> {
  if (!cache.connecting) {
    const env = getServerEnv();
    cache.connecting = mongoose
      .connect(env.MONGODB_URI, {
        // Production indexes are created by `npm run db:indexes` on every deploy.
        autoIndex: env.NODE_ENV !== "production",
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      })
      .catch((error: unknown) => {
        cache.connecting = undefined;
        throw error;
      });
  }
  return cache.connecting;
}
