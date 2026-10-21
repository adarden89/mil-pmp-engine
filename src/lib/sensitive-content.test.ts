import { describe, expect, it } from "vitest";
import { blockingFindings, screenSensitiveContent, sensitiveContentMessage } from "./sensitive-content";

function ids(text: string): string[] {
  return screenSensitiveContent(text).map((finding) => finding.id);
}

describe("screenSensitiveContent", () => {
  it("blocks classification banners and dissemination controls", () => {
    expect(ids("SECRET//NOFORN planning summary")).toEqual(
      expect.arrayContaining(["classification_banner", "dissemination_control"]),
    );
    expect(ids("Briefing marked CONFIDENTIAL")).toContain("classification_banner");
    expect(ids("CUI distribution list")).toContain("cui_marking");
    expect(ids("(S) Moved 12 vehicles")).toContain("portion_marking");
  });

  it("allows a clearance level, which is normal resume content", () => {
    expect(ids("Active TOP SECRET/SCI clearance; held SECRET clearance since 2019")).toEqual([]);
  });

  it("does not flag ordinary lowercase words", () => {
    expect(ids("The secret to our success was a confidential survey of 40 Sailors.")).toEqual([]);
  });

  it("blocks Social Security numbers but not dates or phone numbers", () => {
    expect(ids("SSN 123-45-6789 on file")).toContain("ssn");
    expect(ids("Call 555-123-4567 between 2024-01-15 and 2024-06-30")).toEqual([]);
  });

  it("warns on 10-digit IDs, grid coordinates, and coordinates", () => {
    expect(ids("EDIPI 1234567890")).toContain("dod_id");
    expect(ids("Range at 38SMB 4488 1234")).toContain("mgrs");
    expect(ids("Site at 34.0522, -118.2437")).toContain("lat_long");
  });

  it("separates blocking from warning findings and builds a readable message", () => {
    const findings = screenSensitiveContent("SECRET plan, EDIPI 1234567890");
    expect(blockingFindings(findings).map((finding) => finding.id)).toEqual(["classification_banner"]);
    expect(sensitiveContentMessage(blockingFindings(findings))).toContain("classification marking");
  });

  it("passes realistic evaluation bullets", () => {
    const bullet =
      "-Led 18 Sailors through 6-mo drydock maint period; completed 412 jobs, $1.2M budget, 0 safety mishaps. Div LPO, 3M coordinator.";
    expect(screenSensitiveContent(bullet)).toEqual([]);
  });
});
