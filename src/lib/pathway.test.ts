import { describe, expect, it } from "vitest";
import { PATHWAY_IDS, PATHWAYS } from "./credentials";
import { PATHWAY_CAVEAT, pathwayInputSchema, recommendPathway, type PathwayInput } from "./pathway";

const today = new Date(2026, 9, 21);

const base: PathwayInput = {
  goal: "not_sure",
  familiarity: "new",
  education: "HIGH_SCHOOL",
  documentedProjectMonths: null,
  timeline: "6-12",
  funding: "unknown",
  targetRoles: [],
};

function fitOf(plan: ReturnType<typeof recommendPathway>, id: (typeof PATHWAY_IDS)[number]) {
  return plan.assessments.find((assessment) => assessment.id === id)?.fit;
}

describe("recommendPathway", () => {
  it("starts a beginner with fundamentals and never pushes the PMP", () => {
    const plan = recommendPathway(base, today);
    expect(plan.primary).toBe("fundamentals");
    expect(fitOf(plan, "pmp")).toBe("skip_for_now");
    expect(plan.nextAction.href).toBe("/start#learn");
  });

  it("assesses all six routes, each with reasons, primary first", () => {
    const plan = recommendPathway(base, today);
    expect(plan.assessments.map((a) => a.id).sort()).toEqual([...PATHWAY_IDS].sort());
    expect(plan.assessments[0].id).toBe(plan.primary);
    for (const assessment of plan.assessments) expect(assessment.reasons.length).toBeGreaterThan(0);
  });

  it("recommends the PMP only for a documented leader who meets the months", () => {
    const plan = recommendPathway(
      { ...base, goal: "pmp", familiarity: "led", education: "BACHELOR", documentedProjectMonths: 40 },
      today,
    );
    expect(plan.primary).toBe("pmp");
    expect(fitOf(plan, "capm")).toBe("skip_for_now");
    expect(plan.pmpReadiness).toEqual({ requiredMonths: 36, countedMonths: 40, gapMonths: 0 });
    expect(plan.avoidSpending.some((item) => item.includes("PMP bootcamp"))).toBe(false);
  });

  it("downgrades the PMP to 'consider' when the member coordinated rather than led", () => {
    const plan = recommendPathway(
      { ...base, goal: "pmp", familiarity: "coordinated", education: "BACHELOR", documentedProjectMonths: 40 },
      today,
    );
    expect(fitOf(plan, "pmp")).toBe("consider");
  });

  it("sends a PMP hopeful with unknown months to document evidence, with CAPM as the credential", () => {
    const plan = recommendPathway({ ...base, goal: "pmp", familiarity: "coordinated" }, today);
    expect(fitOf(plan, "pmp")).toBe("not_yet");
    expect(plan.primary).toBe("capm");
    expect(plan.nextAction.href).toBe("/dashboard/evidence");
    expect(plan.avoidSpending.some((item) => item.includes("PMP bootcamp"))).toBe(true);
  });

  it("reports the month gap against the education tier", () => {
    const plan = recommendPathway({ ...base, goal: "pmp", education: "ASSOCIATE", documentedProjectMonths: 30 }, today);
    expect(plan.pmpReadiness.gapMonths).toBe(18);
    expect(plan.assessments.find((a) => a.id === "pmp")?.reasons[0]).toContain("18 months");
  });

  it("applies the 10-year window for veterans", () => {
    const plan = recommendPathway(
      {
        ...base,
        goal: "pmp",
        familiarity: "led",
        education: "BACHELOR",
        documentedProjectMonths: 60,
        separatedOn: "2018-10",
      },
      today,
    );
    expect(plan.pmpReadiness.countedMonths).toBe(24);
    expect(fitOf(plan, "pmp")).toBe("not_yet");
  });

  it("puts job search first for someone separating within 3 months", () => {
    const plan = recommendPathway({ ...base, goal: "pmp", timeline: "0-3" }, today);
    expect(plan.primary).toBe("direct_employment");
  });

  it("prefers PSM I when self-paying and CSM when service funding is planned", () => {
    const selfPay = recommendPathway({ ...base, goal: "agile", funding: "self_pay" }, today);
    expect(selfPay.primary).toBe("psm1");
    expect(fitOf(selfPay, "csm")).toBe("consider");
    const funded = recommendPathway({ ...base, goal: "agile", funding: "service_funding" }, today);
    expect(funded.primary).toBe("csm");
    expect(funded.avoidSpending.some((item) => item.includes("vouchers fund exams, not training"))).toBe(true);
  });

  it("skips Scrum when no goal or role calls for it", () => {
    const plan = recommendPathway({ ...base, goal: "job", targetRoles: ["logistics_supply"] }, today);
    expect(fitOf(plan, "psm1")).toBe("skip_for_now");
    expect(plan.avoidSpending.some((item) => item.startsWith("Scrum courses"))).toBe(true);
  });

  it("always warns against paying before funding approval and carries the caveat", () => {
    const plan = recommendPathway(base, today);
    expect(plan.avoidSpending.some((item) => item.includes("funding is approved"))).toBe(true);
    expect(plan.caveat).toBe(PATHWAY_CAVEAT);
  });

  it("never uses percentages or guarantees in its output", () => {
    const inputs: PathwayInput[] = [
      base,
      { ...base, goal: "pmp", familiarity: "led", education: "BACHELOR", documentedProjectMonths: 40 },
      { ...base, goal: "agile", funding: "service_funding" },
      { ...base, goal: "job", timeline: "0-3", targetRoles: ["project_coordinator"] },
    ];
    for (const input of inputs) {
      const text = JSON.stringify(recommendPathway(input, today));
      expect(text).not.toMatch(/\d+\s?%|guarantee|qualif(y|ied) for the PMP/i);
    }
  });

  it("validates input", () => {
    expect(pathwayInputSchema.safeParse(base).success).toBe(true);
    expect(pathwayInputSchema.safeParse({ ...base, documentedProjectMonths: -1 }).success).toBe(false);
    expect(pathwayInputSchema.safeParse({ ...base, goal: "astronaut" }).success).toBe(false);
  });
});

describe("credential registry", () => {
  it("describes every pathway with plain English, costs, and dated sources", () => {
    for (const id of PATHWAY_IDS) {
      const info = PATHWAYS[id];
      expect(info.plainEnglish.length).toBeGreaterThan(40);
      expect(info.costs.length).toBeGreaterThan(0);
      for (const fact of info.facts) {
        expect(fact.source.url).toMatch(/^https:\/\//);
        expect(fact.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
