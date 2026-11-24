import "server-only";
import type { ClientSession } from "mongoose";

import { connectDb } from "@/server/db/connection";

/** Runs several writes as one transaction: all of them happen or none do. */
export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const { connection } = await connectDb();
  return connection.transaction(work);
}
