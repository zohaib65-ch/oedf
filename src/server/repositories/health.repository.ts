import "server-only";

import { connectDb } from "@/server/db/connection";

/** Sends a ping to MongoDB. Rejects when the database cannot be reached. */
export async function pingDatabase(): Promise<void> {
  const { connection } = await connectDb();
  await connection.getClient().db(connection.name).command({ ping: 1 });
}
