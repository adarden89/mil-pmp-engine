import { describe, expect, it } from "vitest";
import {
  assessEligibility,
  eligibilityInputSchema,
  EXPERIENCE_WINDOW_MONTHS,
  requiredPmpMonths,
  serviceWindow,
  type EligibilityInput,
} from "./eligibility";

const base: EligibilityInput = { branch: "navy", rank: "E5_E6", education: "HIGH_SCHOOL", leadershipMonths: 0 };

describe("requiredPmpMonths", () => {
  it("follows PMI's July 2026 education tiers", () => {
    expect(requiredPmpMonths("HIGH_SCHOOL")).toBe(60);
    expect(requiredPmpMonths("ASSOCIATE")).toBe(48);
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

  it("only counts the last 10 years of experience", () => {
    expect(EXPERIENCE_WINDOW_MONTHS).toBe(120);
    expect(assessEligibility({ ...base, leadershipMonths: 200 }).countedMonths).toBe(120);
  });

  it("routes an associate degree + 48 months to the PMP", () => {
    expect(assessEligibility({ ...base, education: "ASSOCIATE", leadershipMonths: 48 }).path).toBe("PMP");
    expect(assessEligibility({ ...base, education: "ASSOCIATE", leadershipMonths: 47 }).path).toBe("CAPM");
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

describe("10-year lookback for veterans", () => {
  const today = new Date(2026, 9, 21); // October 2026

  it("caps counted months by how much service is still inside the window", () => {
    // Separated October 2020: 72 months ago, so 48 months of service remain in the window.
    const result = assessEligibility(
      { ...base, education: "BACHELOR", leadershipMonths: 70, separatedOn: "2020-10" },
      today,
    );
    expect(result.countedMonths).toBe(48);
    expect(result.path).toBe("PMP");
    expect(result.notes.some((note) => note.text.includes("at most 48 months"))).toBe(true);
  });

  it("drops a veteran below the PMP bar once their service ages out", () => {
    // Separated October 2018: 96 months ago, 24 months left in the window, bachelor's needs 36.
    const result = assessEligibility(
      { ...base, education: "BACHELOR", leadershipMonths: 60, separatedOn: "2018-10" },
      today,
    );
    expect(result.countedMonths).toBe(24);
    expect(result.path).toBe("CAPM");
    expect(result.pmpGapMonths).toBe(12);
  });

  it("gives an apply-by month when the deadline is within two years", () => {
    // Separated December 2019: 82 months ago. Counted months fall below 36 after December 2019 + 84 months.
    const window = serviceWindow("2019-12", 36, today);
    expect(window?.monthsInWindow).toBe(38);
    expect(window?.applyBy).toBe("December 2026");
    expect(window?.monthsUntilApplyBy).toBe(2);
    const result = assessEligibility(
      { ...base, education: "BACHELOR", leadershipMonths: 40, separatedOn: "2019-12" },
      today,
    );
    expect(result.notes.some((note) => note.text.startsWith("Apply by December 2026"))).toBe(true);
  });

  it("ignores a separation month in the future and treats the member as serving", () => {
    const result = assessEligibility({ ...base, leadershipMonths: 70, separatedOn: "2027-01" }, today);
    expect(result.countedMonths).toBe(70);
  });

  it("accepts plans saved before separatedOn existed", () => {
    expect(
      eligibilityInputSchema.safeParse({ branch: "army", rank: "E5_E6", education: "BACHELOR", leadershipMonths: 12 })
        .success,
    ).toBe(true);
    expect(eligibilityInputSchema.safeParse({ ...base, separatedOn: "2020-13" }).success).toBe(false);
  });
});
