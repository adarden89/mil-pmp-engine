import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Pixel ids are public identifiers; exposing them here keeps one env var per platform.
  env: {
    NEXT_PUBLIC_META_PIXEL_ID: process.env.META_PIXEL_ID ?? "",
    NEXT_PUBLIC_TIKTOK_PIXEL_ID: process.env.TIKTOK_PIXEL_ID ?? "",
    NEXT_PUBLIC_TRACKING_CONSENT_MODE: process.env.TRACKING_CONSENT_MODE ?? "opt-out",
  },
  // jsPDF ships a dedicated Node build; load it as-is instead of bundling it.
  serverExternalPackages: ["jspdf"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
