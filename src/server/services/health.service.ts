import "server-only";

import { pingDatabase } from "@/server/repositories/health.repository";

/** Confirms the database answers, for the hosting provider's health probe. */
export async function checkHealth(): Promise<{ status: "ok" }> {
  await pingDatabase();
  return { status: "ok" };
}
