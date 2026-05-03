import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/ holds runtime user content (articles, plans, hero stories, wrong-answer
  // images, etc.) — never bundled at build time. Excluding it from File Tracing
  // keeps the standalone output lean.
  outputFileTracingExcludes: {
    "*": ["data/**"],
  },
};

export default nextConfig;
