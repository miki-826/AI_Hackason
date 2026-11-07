import type { NextConfig } from "next";

// The offline demo runs the full rules in the browser, so it contains the
// puzzle answer. Unless demo mode is explicitly enabled at build time, swap it
// for an empty stub so no spoiler reaches the client bundle (spec 5.3).
const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
const demoAlias: Record<string, string> = demoEnabled
  ? {}
  : { "@/lib/client/demoGateway": "./src/lib/client/demoGatewayDisabled.ts" };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { resolveAlias: demoAlias },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
