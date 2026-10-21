import { describe, expect, it } from "vitest";
import {
  assessEligibility,
  EXPERIENCE_WINDOW_MONTHS,
  estimateLeadershipMonths,
  requiredPmpMonths,
} from "./eligibility";

describe("requiredPmpMonths", () => {
  it("follows PMI's education-based thresholds", () => {
    expect(requiredPmpMonths("HIGH_SCHOOL")).toBe(60);
    expect(requiredPmpMonths("ASSOCIATE")).toBe(60);
    expect(requiredPmpMonths("BACHELOR")).toBe(36);
    expect(requiredPmpMonths("GRADUATE")).toBe(36);
    expect(requiredPmpMonths("BACHELOR_GAC")).toBe(24);
  });
});

describe("estimateLeadershipMonths", () => {
  it("gives junior enlisted no leadership months regardless of time in service", () => {
    expect(estimateLeadershipMonths("E1_E3", "10_PLUS")).toBe(0);
  });

  it("caps at PMI's eight-year experience window", () => {
    expect(estimateLeadershipMonths("O3_PLUS", "10_PLUS")).toBe(EXPERIENCE_WINDOW_MONTHS);
  });

  it("uses the low end of the service band", () => {
    expect(estimateLeadershipMonths("E5", "4_6")).toBe(24);
  });
});

describe("assessEligibility", () => {
  it("recommends the CAPM for a junior enlisted member with no PM background", () => {
    const result = assessEligibility({ rank: "E1_E3", service: "2_4", education: "HIGH_SCHOOL" });
    expect(result.recommendation).toBe("CAPM");
    expect(result.confidence).toBe("not_yet");
    expect(result.educationHoursRequired).toBe(23);
  });

  it("recommends CAPM-then-PMP when the gap is two years or less", () => {
    // E-6 with 4-6 years: 48 * 0.7 = 33 months vs 60 required -> 27 month gap (too big)
    // E-6 with 6-10 years: 72 * 0.7 = 50 months vs 60 required -> 10 month gap
    const result = assessEligibility({ rank: "E6", service: "6_10", education: "HIGH_SCHOOL" });
    expect(result.recommendation).toBe("CAPM_THEN_PMP");
    expect(result.gapMonths).toBe(10);
  });

  it("recommends the PMP when estimated experience clears the bar", () => {
    const result = assessEligibility({ rank: "O3_PLUS", service: "6_10", education: "BACHELOR" });
    expect(result.recommendation).toBe("PMP");
    expect(result.confidence).toBe("strong");
    expect(result.educationHoursRequired).toBe(35);
  });

  it("flags a borderline PMP candidate", () => {
    // E-5, 6-10 years: 72 * 0.5 = 36 months vs 36 required -> exactly at the bar
    const result = assessEligibility({ rank: "E5", service: "6_10", education: "BACHELOR" });
    expect(result.recommendation).toBe("PMP");
    expect(result.confidence).toBe("borderline");
  });

  it("never reports a negative gap", () => {
    const result = assessEligibility({ rank: "E7_E9", service: "10_PLUS", education: "GRADUATE" });
    expect(result.gapMonths).toBe(0);
  });
});
