import { describe, expect, it } from "vitest";
import { coverageFor, MILITARY_DUTIES, totalMapperMonths } from "./accidental-pm";
import { assessEligibility } from "./eligibility";
import { allTaskIds, buildRoadmap, currentPhase, roadmapProgress } from "./roadmap";

const capm = assessEligibility({ branch: "navy", rank: "E1_E4", education: "HIGH_SCHOOL", leadershipMonths: 0 });
const pmp = assessEligibility({ branch: "army", rank: "E7_E9", education: "BACHELOR", leadershipMonths: 60 });

describe("buildRoadmap", () => {
  it("gives Navy members the OPNAV 1500/57 funding task", () => {
    const ids = allTaskIds(buildRoadmap(capm, "navy"));
    expect(ids).toContain("fund-navy-1500-57");
    expect(ids).not.toContain("app-translate");
  });

  it("adds the translation step for PMP candidates and uses the branch portal", () => {
    const ids = allTaskIds(buildRoadmap(pmp, "army"));
    expect(ids).toContain("app-translate");
    expect(ids).toContain("fund-army-portal");
  });

  it("has unique task ids so progress can be stored safely", () => {
    for (const roadmap of [buildRoadmap(capm, "navy"), buildRoadmap(pmp, "army")]) {
      const ids = allTaskIds(roadmap);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("blocks exam scheduling until the voucher arrives", () => {
    const exam = buildRoadmap(capm, "navy").phases.find((phase) => phase.id === "exam");
    expect(exam?.tasks.find((task) => task.id === "exam-schedule")?.blockedUntilVoucher).toBe(true);
  });
});

describe("progress", () => {
  it("computes percent complete and the current phase", () => {
    const roadmap = buildRoadmap(capm, "navy");
    const foundation = roadmap.phases[0].tasks.map((task) => task.id);
    const progress = roadmapProgress(roadmap, foundation);
    expect(progress.done).toBe(foundation.length);
    expect(progress.percent).toBe(Math.round((foundation.length / progress.total) * 100));
    expect(currentPhase(roadmap, foundation)?.id).toBe("education");
  });
});

describe("Accidental PM mapper", () => {
  it("is honest that some duties are operations, not projects", () => {
    expect(MILITARY_DUTIES.find((duty) => duty.id === "watchbill")?.isProject).toBe(false);
    expect(MILITARY_DUTIES.find((duty) => duty.id === "ftx-planning")?.isProject).toBe(true);
  });

  it("maps every duty across all five process groups", () => {
    for (const duty of MILITARY_DUTIES) {
      expect(Object.values(duty.processGroups).every((items) => items.length > 0)).toBe(true);
    }
    expect(coverageFor([{ dutyId: "ftx-planning", months: 3 }]).closing).toBe(1);
  });

  it("caps total months at the 10-year window and ignores negatives", () => {
    expect(
      totalMapperMonths([
        { dutyId: "a", months: 80 },
        { dutyId: "b", months: 60 },
      ]),
    ).toBe(120);
    expect(
      totalMapperMonths([
        { dutyId: "a", months: -5 },
        { dutyId: "b", months: 6 },
      ]),
    ).toBe(6);
  });
});
