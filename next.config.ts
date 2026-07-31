import type { NextConfig } from "next";

import { legacyRedirects } from "./src/lib/content/routes";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ],
    },
  ],
  redirects: async () =>
    legacyRedirects.map(({ source, destination }) => ({
      source,
      destination,
      statusCode: 301 as const,
    })),
};

export default nextConfig;
