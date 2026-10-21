import type { Branch } from "./translation-schema";

/**
 * Public URL slugs for /start/[branch]. These appear in ad links, so they are
 * short and stable; aliases cover the spellings people actually type.
 */
export const BRANCH_SLUGS: Record<Branch, string> = {
  navy: "navy",
  army: "army",
  air_force: "airforce",
  marine_corps: "marines",
  coast_guard: "coastguard",
  space_force: "spaceforce",
};

const ALIASES: Record<string, Branch> = {
  usn: "navy",
  usa: "army",
  "air-force": "air_force",
  usaf: "air_force",
  "marine-corps": "marine_corps",
  marinecorps: "marine_corps",
  usmc: "marine_corps",
  "coast-guard": "coast_guard",
  uscg: "coast_guard",
  "space-force": "space_force",
  ussf: "space_force",
};

/** Canonical slug or alias to a branch, case-insensitive. Null for anything else. */
export function branchFromSlug(slug: string): Branch | null {
  const normalized = slug.trim().toLowerCase();
  const canonical = (Object.entries(BRANCH_SLUGS) as [Branch, string][]).find(([, value]) => value === normalized);
  return canonical ? canonical[0] : (ALIASES[normalized] ?? null);
}

/** True when the slug is an alias that should redirect to the canonical URL. */
export function isAliasSlug(slug: string): boolean {
  return slug.trim().toLowerCase() in ALIASES;
}
