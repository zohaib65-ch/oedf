import mongoose from "mongoose";

import { connectDb } from "@/server/db/connection";
import { ALL_MODELS } from "@/server/db/models/all-models";

/** Creates missing indexes and removes indexes that are no longer in the schemas. Run on every deploy. */
async function syncAllIndexes(): Promise<void> {
  await connectDb();
  for (const Model of ALL_MODELS) {
    const dropped = await Model.syncIndexes();
    const note = dropped.length > 0 ? `, dropped ${dropped.join(", ")}` : "";
    console.info(`${Model.modelName}: indexes in sync${note}`);
  }
}

try {
  await syncAllIndexes();
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
