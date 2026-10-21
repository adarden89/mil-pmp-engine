import { describe, expect, it } from "vitest";
import {
  analyzeAuditDensity,
  auditSourceFor,
  countQuantifiers,
  extractFigures,
  findJargon,
  findUnsupportedFigures,
} from "./audit-density";
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
    expect(findJargon("Briefed the S-3 on the FTX COA as NCOIC")).toEqual(["S-3", "FTX", "COA", "NCOIC"]);
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

describe("figure fidelity", () => {
  const source = {
    text: "- Managed $2.1M avionics supply chain inventory for three squadrons\n- Cut backorders 37% in 9 months; led team of 12",
  };

  it("matches scaled and spelled-out figures", () => {
    expect(extractFigures("$2.1 million")[0].values).toEqual([2.1, 2100000]);
    expect(
      findUnsupportedFigures("I managed a $2.1 million inventory for 3 squadrons and cut backorders 37%.", source),
    ).toEqual([]);
  });

  it("flags figures the member never wrote", () => {
    const unsupported = findUnsupportedFigures(
      "I led 12 technicians, saved $450,000, and improved readiness 18%.",
      source,
    );
    expect(unsupported).toEqual(["450,000", "18"]);
  });

  it("ignores calendar years and small list counts", () => {
    expect(findUnsupportedFigures("In 2024 I ran 2 phases of work.", source)).toEqual([]);
  });

  it("allows the project length derived from the dates and the team size", () => {
    const derived = auditSourceFor({
      branch: "army",
      rateOrMos: "11B",
      billet: "Platoon Sergeant",
      projectTitle: "Range operations",
      startMonth: "2024-01",
      endMonth: "2024-06",
      teamSize: 40,
      rawBullets: "Planned and executed 3 range operations for 120 soldiers with zero safety incidents.",
    });
    expect(
      findUnsupportedFigures("Over 6 months I led 40 personnel through 3 range operations for 120 soldiers.", derived),
    ).toEqual([]);
  });

  it("adds a fidelity check to the report only when the source is known", () => {
    const result = makeResult({ outcome: "Delivered early." });
    expect(analyzeAuditDensity(result).checks.some((check) => check.id === "fidelity")).toBe(false);
    const report = analyzeAuditDensity(result, { text: "Migrated 220 workstations with a 14-person team." });
    const fidelity = report.checks.find((check) => check.id === "fidelity");
    expect(fidelity?.status).toBe("fail");
    expect(report.unsupportedFigures).toContain("$180,000".replace("$", ""));
  });
});
