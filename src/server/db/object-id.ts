import "server-only";
import { Types } from "mongoose";

/** A new document ID as a string, so related documents can point at each other before they are saved. */
export function newId(): string {
  return new Types.ObjectId().toString();
}
