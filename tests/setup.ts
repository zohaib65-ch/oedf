import { randomUUID } from "node:crypto";

import mongoose from "mongoose";
import { afterAll, vi } from "vitest";

// `server-only` throws outside Next.js's server build, so tests replace it with an empty module.
vi.mock("server-only", () => ({}));

// Each test file gets its own empty database on the shared in-memory replica set.
const baseUri = process.env.TEST_MONGODB_BASE_URI;
if (baseUri) {
  const [uriWithoutQuery = "", query = ""] = baseUri.split("?");
  const databaseName = `test_${randomUUID().replaceAll("-", "")}`;
  process.env.MONGODB_URI = `${uriWithoutQuery.replace(/\/$/, "")}/${databaseName}?${query}`;
}

afterAll(async () => {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
