import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet: MongoMemoryReplSet | undefined;

/** Starts one in-memory MongoDB replica set (so transactions work) for the whole test run. */
export async function setup(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  // Test workers are started after this runs, so they inherit the variable.
  process.env.TEST_MONGODB_BASE_URI = replSet.getUri();
}

export async function teardown(): Promise<void> {
  await replSet?.stop();
}
