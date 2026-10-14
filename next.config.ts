import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // The full local search index (trial/corpus/index) is never deployed;
  // search-index/ (the canon only) is, with the search page alone.
  outputFileTracingExcludes: { "/**": ["./trial/**"] },
  outputFileTracingIncludes: {
    "/coding/protocol": ["./research/coding/PROTOCOL.md"],
    "/search": ["./search-index/**"],
  },
  async redirects() {
    return [{ source: "/themes", destination: "/", permanent: false },
      { source: "/questions", destination: "/", permanent: false }];
  },
};

export default nextConfig;
