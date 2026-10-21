"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { assessEligibility } from "@/lib/eligibility";
import { buildRoadmap } from "@/lib/roadmap";
import { AccidentalPmMapper } from "./accidental-pm-mapper";
import { EligibilityQuiz } from "./eligibility-quiz";
import { EligibilityResultView } from "./eligibility-result";
import { planStore, usePlan, usePlanSync } from "./plan-store";
import { RoadmapView } from "./roadmap-view";

const noopSubscribe = () => () => {};

/** Quiz, result, roadmap, and mapper share one plan so each step feeds the next. */
export function EligibilityExperience() {
  usePlanSync();
  const plan = usePlan();
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const result = useMemo(() => (plan.input ? assessEligibility(plan.input) : null), [plan.input]);
  const roadmap = useMemo(
    () => (plan.input && result ? buildRoadmap(result, plan.input.branch) : null),
    [plan.input, result],
  );

  return (
    <div className="space-y-20">
      <section id="quiz" className="scroll-mt-24 space-y-6">
        {!isClient ? (
          <div className="h-[460px] animate-pulse rounded-2xl bg-muted" aria-label="Loading" />
        ) : plan.input && result && roadmap ? (
          <>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => planStore.replace({ ...plan, input: null })}
                icon={<RotateCcw className="size-4" aria-hidden />}
              >
                Retake the quiz
              </Button>
            </div>
            <EligibilityResultView input={plan.input} result={result} />
            <RoadmapView roadmap={roadmap} />
          </>
        ) : (
          <EligibilityQuiz onComplete={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        )}
      </section>
      <AccidentalPmMapper />
    </div>
  );
}
