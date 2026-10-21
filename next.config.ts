import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Stripe's Express Checkout Element runs Apple Pay / Google Pay inside a js.stripe.com frame.
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
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
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    // Same truthy spellings z.stringbool() accepts in src/lib/env.ts, so browser and server agree.
    NEXT_PUBLIC_EXPERT_REVIEW_ENABLED: ["true", "1", "yes", "on", "y", "enabled"].includes(
      (process.env.EXPERT_REVIEW_ENABLED ?? "").trim().toLowerCase(),
    )
      ? "true"
      : "",
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
  async redirects() {
    // The studio moved into the dashboard next to the training guide.
    const branchAliases: [string, string][] = [
      ["usn", "navy"],
      ["usa", "army"],
      ["air-force", "airforce"],
      ["usaf", "airforce"],
      ["marine-corps", "marines"],
      ["marinecorps", "marines"],
      ["usmc", "marines"],
      ["coast-guard", "coastguard"],
      ["uscg", "coastguard"],
      ["space-force", "spaceforce"],
      ["ussf", "spaceforce"],
    ];
    return [
      { source: "/translate", destination: "/dashboard/translator", permanent: true },
      // Ad links stay forgiving: aliases land on the canonical branch page (see src/lib/branch-slugs.ts).
      ...branchAliases.map(([alias, slug]) => ({
        source: `/start/${alias}`,
        destination: `/start/${slug}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
