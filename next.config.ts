import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { type NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  reactCompiler: { compilationMode: "annotation" },
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks", "@tabler/icons-react"],
  },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  poweredByHeader: false,
  // Build and dev tooling that tracing picks up but the Worker never runs.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/wrangler/**",
      "node_modules/miniflare/**",
      "node_modules/workerd/**",
      "node_modules/@cloudflare/workerd-*/**",
      "node_modules/esbuild/**",
      "node_modules/@esbuild/**",
      "node_modules/blake3-wasm/**",
      "node_modules/prisma/**",
      "node_modules/@prisma/engines/**",
      "node_modules/@prisma/dev/**",
      "node_modules/@prisma/studio-core/**",
      "node_modules/@electric-sql/**",
      "node_modules/better-sqlite3/**",
      "node_modules/@prisma/adapter-better-sqlite3/**",
      "node_modules/@prisma/client/runtime/*.mysql.*",
      "node_modules/@prisma/client/runtime/*.postgresql.*",
      "node_modules/@prisma/client/runtime/*.sqlserver.*",
      "node_modules/@prisma/client/runtime/*.cockroachdb.*",
      "src/generated/prisma-node/**",
      "node_modules/next/dist/compiled/@vercel/og/**",
    ],
  },
};

export default config;

// Gives `next dev` the same Cloudflare bindings (local D1) as the deployed Worker.
void initOpenNextCloudflareForDev();
