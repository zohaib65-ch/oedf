import type { NextConfig } from "next";

import { getServerEnv } from "./src/env";

// The app refuses to start (and to build) when an environment variable is missing or malformed.
getServerEnv();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
