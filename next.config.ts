import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "lh3.googleusercontent.com",
      },
      {
        hostname: "static-cdn.jtvnw.net",
      },
      {
        hostname: "r2.thesportsdb.com",
      },
    ],
  },
};

export default nextConfig;
