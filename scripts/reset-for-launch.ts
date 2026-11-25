// Empties a database for launch: removes sample content, test records, logs and sessions, and keeps
// the five offices, the settings (without sample impact numbers) and the Super Admin accounts.
//
//   npm run db:reset-for-launch -- --database=oedf            shows what would be removed
//   npm run db:reset-for-launch -- --database=oedf --confirm  removes it
//
// It uses the cluster in MONGODB_URI with the database named here, so the name is always typed out.
import { parseArgs } from "node:util";

import { MongoClient, type Db } from "mongodb";

/** Collections emptied completely. */
const EMPTIED = [
  "applications",
  "scholarshipAwards",
  "vacancies",
  "jobApplications",
  "programs",
  "institutions",
  "publications",
  "newsPosts",
  "faqs",
  "contactMessages",
  "directives",
  "fileAssets",
  "auditLogs",
  "counters",
  "rateLimits",
  "rateLimit",
  "session",
  "verification",
] as const;

const SAMPLE_LABEL = /^Sample\b/;

async function plan(db: Db): Promise<{ name: string; count: number }[]> {
  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name),
  );
  const rows = await Promise.all(
    EMPTIED.filter((name) => existing.has(name)).map(async (name) => ({
      name,
      count: await db.collection(name).countDocuments(),
    })),
  );
  const otherUsers = await db.collection("user").countDocuments({ role: { $ne: "SUPER_ADMIN" } });
  return [...rows, { name: "user (not Super Admin)", count: otherUsers }];
}

async function reset(db: Db): Promise<void> {
  for (const name of EMPTIED) {
    await db.collection(name).deleteMany({});
  }
  const others = await db
    .collection("user")
    .find({ role: { $ne: "SUPER_ADMIN" } }, { projection: { _id: 1 } })
    .toArray();
  const ids = others.map((user) => user._id);
  await db.collection("account").deleteMany({ userId: { $in: ids } });
  await db.collection("user").deleteMany({ _id: { $in: ids } });
  await db
    .collection<{ impactNumbers: { label: string; value: number }[] }>("siteSettings")
    .updateMany({}, { $pull: { impactNumbers: { label: SAMPLE_LABEL } } });
}

const { values } = parseArgs({
  options: { database: { type: "string" }, confirm: { type: "boolean", default: false } },
});
const uri = process.env.MONGODB_URI;
if (!uri || !values.database) {
  throw new Error("Set MONGODB_URI and pass --database=<name>.");
}
if (/-(dev|test)$/.test(values.database)) {
  throw new Error("This is for the production database; development data is cleaned by the tests.");
}

const client = await MongoClient.connect(uri);
try {
  const db = client.db(values.database);
  const before = await plan(db);
  console.info(`Database ${db.databaseName}:`);
  for (const row of before) {
    console.info(`  ${row.name}: ${String(row.count)} to remove`);
  }
  if (values.confirm) {
    await reset(db);
    const kept = {
      departments: await db.collection("departments").countDocuments(),
      siteSettings: await db.collection("siteSettings").countDocuments(),
      superAdmins: await db.collection("user").countDocuments({ role: "SUPER_ADMIN" }),
    };
    console.info("Removed. Kept:", kept);
  } else {
    console.info("Nothing removed. Run again with --confirm to remove it.");
  }
} finally {
  await client.close();
}
