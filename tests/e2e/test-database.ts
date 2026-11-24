/**
 * The end-to-end tests write records and accounts, so they refuse any database that could be
 * production: only a local database, or one whose name ends in `-dev` or `-test`, is accepted.
 */
export function assertTestDatabase(uri: string | undefined): void {
  if (!uri) {
    throw new Error("MONGODB_URI is needed to run the end-to-end tests.");
  }
  const isLocal = /^mongodb:\/\/(?:[^@/]*@)?(?:localhost|127\.0\.0\.1)[:/]/.test(uri);
  const name = uri.replace(/^mongodb(?:\+srv)?:\/\/[^/]*\/?/, "").split("?")[0] ?? "";
  if (!isLocal && !/-(?:dev|test)$/.test(name)) {
    throw new Error(
      `Refusing to run the end-to-end tests against the database "${name || "(none)"}". Use a database whose name ends in -dev or -test.`,
    );
  }
}
