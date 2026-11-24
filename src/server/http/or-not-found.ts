import "server-only";
import { notFound } from "next/navigation";

import { AppError } from "@/server/http/errors";

/** For a page: a record that does not exist shows the 404 view instead of an error. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error: unknown) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
