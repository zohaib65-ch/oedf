import type { NextConfig } from "next";

import { getServerEnv } from "./src/env";

// The app refuses to start (and to build) when an environment variable is missing or malformed.
const { CLOUDINARY_URL } = getServerEnv();

// Public images come only from this project's own Cloudinary account (the cloud name is the host
// of CLOUDINARY_URL). Without it, no remote image is allowed.
const cloudName = CLOUDINARY_URL ? new URL(CLOUDINARY_URL).hostname : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: cloudName
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloudName}/image/upload/**`,
          },
        ]
      : [],
  },
};

export default nextConfig;
