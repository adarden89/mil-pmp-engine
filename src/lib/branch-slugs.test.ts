import { describe, expect, it } from "vitest";
import { BRANCH_SLUGS, branchFromSlug, isAliasSlug } from "./branch-slugs";
import { BRANCHES } from "./translation-schema";

describe("branch slugs", () => {
  it("round-trips every canonical slug", () => {
    for (const branch of BRANCHES) expect(branchFromSlug(BRANCH_SLUGS[branch])).toBe(branch);
  });

  it("accepts common aliases and casing", () => {
    expect(branchFromSlug("USMC")).toBe("marine_corps");
    expect(branchFromSlug("air-force")).toBe("air_force");
    expect(isAliasSlug("uscg")).toBe(true);
    expect(isAliasSlug("navy")).toBe(false);
  });

  it("rejects unknown slugs", () => {
    expect(branchFromSlug("national-guard")).toBeNull();
    expect(branchFromSlug("")).toBeNull();
  });
});
