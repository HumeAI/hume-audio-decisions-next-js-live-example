import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The SDK is linked from a sibling checkout, and Turbopack does not
    // follow symlinks out of the project unless the target is a declared root.
    turbopackAdditionalRoots: {
      decisionsSdk: {
        path: path.join(__dirname, "../hume-decisions-typescript-sdk"),
      },
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
