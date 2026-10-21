import { describe, expect, it } from "vitest";
import { checkNavyCoolTiming } from "./navy-cool";

const TODAY = new Date("2026-10-21T12:00:00Z");

describe("checkNavyCoolTiming", () => {
  it("passes when EAOS is well out and the exam is early enough", () => {
    expect(checkNavyCoolTiming("2028-06", "2027-01", TODAY)).toEqual([]);
  });

  it("blocks when EAOS is within two months of Navy COOL receiving the form", () => {
    const issues = checkNavyCoolTiming("2026-12", undefined, TODAY);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("blocker");
  });

  it("blocks an exam scheduled inside the 60-day separation window", () => {
    const issues = checkNavyCoolTiming("2027-06", "2027-05", TODAY);
    expect(issues.some((issue) => issue.message.includes("60 days"))).toBe(true);
  });

  it("warns when the target exam month is before approval could arrive", () => {
    const issues = checkNavyCoolTiming("2028-06", "2026-10", TODAY);
    expect(issues.some((issue) => issue.severity === "warning")).toBe(true);
  });

  it("asks for an EAOS when none is given", () => {
    expect(checkNavyCoolTiming(undefined, undefined, TODAY)[0].severity).toBe("warning");
  });
});
