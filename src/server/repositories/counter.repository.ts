import "server-only";
import type { ClientSession } from "mongoose";

import { CounterModel } from "@/server/db/models/counter.model";

/** The next number of a named counter (for example `ADM-2026`). One atomic update, so it never repeats. */
export async function nextSequence(name: string, session: ClientSession): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", session, projection: { seq: 1 } },
  ).lean();
  if (!counter) {
    throw new Error("The counter was not created.");
  }
  return counter.seq;
}
