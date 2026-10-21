import { describe, expect, it } from "vitest";
import { assessEligibility, EXPERIENCE_WINDOW_MONTHS, requiredPmpMonths, type EligibilityInput } from "./eligibility";

const base: EligibilityInput = { branch: "navy", rank: "E5_E6", education: "HIGH_SCHOOL", leadershipMonths: 0 };

describe("requiredPmpMonths", () => {
  it("follows PMI's education-based thresholds", () => {
    expect(requiredPmpMonths("HIGH_SCHOOL")).toBe(60);
    expect(requiredPmpMonths("ASSOCIATE")).toBe(60);
    expect(requiredPmpMonths("BACHELOR")).toBe(36);
    expect(requiredPmpMonths("GRADUATE")).toBe(36);
    expect(requiredPmpMonths("BACHELOR_GAC")).toBe(24);
  });
});

describe("assessEligibility routing", () => {
  it("routes high school + under 36 months to the CAPM (23 hours, no experience)", () => {
    const result = assessEligibility({ ...base, leadershipMonths: 20 });
    expect(result.path).toBe("CAPM");
    expect(result.educationHours).toBe(23);
    expect(result.pmpGapMonths).toBe(40);
  });

  it("routes high school + 60 months to the PMP (35 hours)", () => {
    const result = assessEligibility({ ...base, leadershipMonths: 60 });
    expect(result.path).toBe("PMP");
    expect(result.educationHours).toBe(35);
  });

  it("keeps high school + 36 to 59 months on the CAPM with a dated PMP gap", () => {
    const result = assessEligibility({ ...base, leadershipMonths: 48 });
    expect(result.path).toBe("CAPM");
    expect(result.pmpGapMonths).toBe(12);
  });

  it("routes a bachelor's degree + 36 months to the PMP", () => {
    expect(assessEligibility({ ...base, education: "BACHELOR", leadershipMonths: 36 }).path).toBe("PMP");
    expect(assessEligibility({ ...base, education: "BACHELOR", leadershipMonths: 35 }).path).toBe("CAPM");
  });

  it("routes E-1 to E-4 to the CAPM even when the months meet the PMP bar, and says why", () => {
    const result = assessEligibility({ ...base, rank: "E1_E4", education: "BACHELOR", leadershipMonths: 40 });
    expect(result.path).toBe("CAPM");
    expect(result.pmpGapMonths).toBe(0);
    expect(result.notes.some((note) => note.text.includes("on paper"))).toBe(true);
  });

  it("only counts the last eight years of experience", () => {
    expect(assessEligibility({ ...base, leadershipMonths: 200 }).countedMonths).toBe(EXPERIENCE_WINDOW_MONTHS);
  });

  it("flags borderline PMP candidates for audit care", () => {
    const result = assessEligibility({ ...base, education: "BACHELOR", leadershipMonths: 38 });
    expect(result.path).toBe("PMP");
    expect(result.notes[0].tone).toBe("warning");
  });
});

describe("funding notes", () => {
  it("always carries the do-not-pay-out-of-pocket warning", () => {
    expect(assessEligibility(base).notes.some((note) => note.tone === "critical")).toBe(true);
  });

  it("warns Navy officers that Navy COOL officer funding may not be available", () => {
    const officer = assessEligibility({ ...base, rank: "O1_O3", education: "BACHELOR", leadershipMonths: 40 });
    expect(officer.notes.some((note) => note.text.includes("officer funding"))).toBe(true);
    const soldier = assessEligibility({
      ...base,
      branch: "army",
      rank: "O1_O3",
      education: "BACHELOR",
      leadershipMonths: 40,
    });
    expect(soldier.notes.some((note) => note.text.includes("officer funding"))).toBe(false);
  });
});
