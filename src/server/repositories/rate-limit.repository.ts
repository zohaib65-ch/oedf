import "server-only";

import { connectDb } from "@/server/db/connection";
import { RateLimitModel } from "@/server/db/models/rate-limit.model";

/** Adds one to a bucket (creating it on first use) and returns the new count. A TTL index removes old buckets. */
export async function incrementRateLimit(key: string, expiresAt: Date): Promise<number> {
  await connectDb();
  const bucket = await RateLimitModel.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: "after", projection: { count: 1 } },
  ).lean();
  if (!bucket) {
    throw new Error("The rate limit bucket was not created.");
  }
  return bucket.count;
}
