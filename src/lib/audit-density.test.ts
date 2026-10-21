import { describe, expect, it } from "vitest";
import { analyzeAuditDensity, countQuantifiers, findJargon } from "./audit-density";
import type { TranslationResult } from "./translation-schema";

function words(count: number, word = "delivered"): string {
  return Array.from({ length: count }, () => word).join(" ");
}

const strongSummary = [
  "I led a 14-person team to migrate 220 workstations to a new network baseline over 6 months with a $180,000 budget.",
  "I developed the project charter, I built the schedule and risk register, and I tracked cost and schedule variance weekly.",
  "The migration finished 3 weeks early and cut outage tickets by 42%.",
  words(160),
].join(" ");

function makeResult(overrides: Partial<TranslationResult> = {}): TranslationResult {
  return {
    civilianProjectTitle: "Network Modernization",
    objective: "Modernize the network baseline.",
    role: "Project lead",
    deliverables: ["Migration plan", "Updated network baseline"],
    outcome: "Delivered 3 weeks early, 42% fewer outage tickets.",
    applicationSummary: strongSummary,
    processGroups: {
      initiating: ["Developed charter"],
      planning: ["Built schedule"],
      executing: ["Led team"],
      monitoringControlling: ["Tracked variance"],
      closing: ["Obtained acceptance"],
    },
    jargonTranslations: [],
    auditFlags: [],
    suggestedVerifier: "Department head",
    ...overrides,
  };
}

describe("findJargon", () => {
  it("matches whole-word military terms only", () => {
    expect(findJargon("As LPO I briefed the CO on the INSURV POA&M.")).toEqual(["LPO", "CO", "INSURV", "POA&M"]);
    expect(findJargon("Coordinated with COOL staff on a commanded change")).toEqual([]);
  });
});

describe("countQuantifiers", () => {
  it("counts money, percentages, multipliers, and plain counts but not years", () => {
    expect(countQuantifiers("Saved $1.2M, cut errors 40%, 3x faster, 12 people, in 2024")).toBe(4);
  });
});

describe("analyzeAuditDensity", () => {
  it("rates a complete, quantified, first-person write-up as audit-ready", () => {
    const report = analyzeAuditDensity(makeResult());
    expect(report.grade).toBe("audit_ready");
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("penalizes short, jargon-heavy write-ups with no lifecycle coverage", () => {
    const report = analyzeAuditDensity(
      makeResult({
        applicationSummary: "We supported the CO and XO as LPO during deployment.",
        outcome: "",
        processGroups: {
          initiating: [],
          planning: [],
          executing: ["Supported team"],
          monitoringControlling: [],
          closing: [],
        },
      }),
    );
    expect(report.grade).toBe("high_risk");
    expect(report.checks.find((check) => check.id === "jargon")?.status).toBe("fail");
    expect(report.checks.find((check) => check.id === "coverage")?.status).toBe("fail");
    expect(report.checks.find((check) => check.id === "length")?.status).toBe("fail");
  });
});

describe("sample translation", () => {
  it("is audit-ready, so the studio demo models what good output looks like", async () => {
    const { SAMPLE_TRANSLATION } = await import("./sample-translation");
    const report = analyzeAuditDensity(SAMPLE_TRANSLATION);
    expect(report.wordCount).toBeGreaterThanOrEqual(200);
    expect(report.wordCount).toBeLessThanOrEqual(500);
    expect(report.grade).toBe("audit_ready");
  });
});
