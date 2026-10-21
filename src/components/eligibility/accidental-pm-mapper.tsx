"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, CircleCheck, CircleSlash, Wand } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form-controls";
import { SectionHeading } from "@/components/ui/primitives";
import { coverageFor, dutiesFor, MILITARY_DUTIES, totalMapperMonths, type MapperSelection } from "@/lib/accidental-pm";
import { PROCESS_GROUP_LABELS, type ProcessGroupKey } from "@/lib/translation-schema";
import { cn } from "@/lib/utils";
import { planStore, usePlan } from "./plan-store";

const GROUPS: ProcessGroupKey[] = ["initiating", "planning", "executing", "monitoringControlling", "closing"];

export function AccidentalPmMapper() {
  const plan = usePlan();
  const selections = plan.mapper;
  const selected = new Set(selections.map((item) => item.dutyId));
  const coverage = coverageFor(selections);
  const total = totalMapperMonths(selections);
  const branch = plan.input?.branch ?? null;
  const duties = dutiesFor(branch);

  function toggle(dutyId: string) {
    const next: MapperSelection[] = selected.has(dutyId)
      ? selections.filter((item) => item.dutyId !== dutyId)
      : [...selections, { dutyId, months: 0 }];
    planStore.setMapper(next);
  }

  function setMonths(dutyId: string, months: number) {
    planStore.setMapper(selections.map((item) => (item.dutyId === dutyId ? { ...item, months } : item)));
  }

  return (
    <section id="mapper" className="scroll-mt-24">
      <SectionHeading
        align="left"
        eyebrow="Accidental PM mapper"
        title="You have been managing projects. You just called them something else."
        description="Pick the duties you have led. Each one is translated into PMI's five process groups, with an honest call on whether PMI will see it as a project or as routine operations."
      />

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Military duties">
        {duties.map((duty) => (
          <button
            key={duty.id}
            type="button"
            onClick={() => toggle(duty.id)}
            aria-pressed={selected.has(duty.id)}
            className={cn(
              "min-h-10 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              selected.has(duty.id)
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            {duty.label}
            {branch && duty.branches?.includes(branch) ? (
              <span className="ml-1.5 text-[10px] font-medium tracking-wide text-primary uppercase">Your branch</span>
            ) : null}
          </button>
        ))}
      </div>

      {selections.length > 0 ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card/70 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid grid-cols-5 gap-2">
            {GROUPS.map((key) => (
              <div key={key} className="text-center">
                <div
                  className={cn(
                    "mx-auto h-1.5 rounded-full",
                    coverage[key] > 0 ? "bg-gradient-to-r from-primary to-brand-2" : "bg-muted",
                  )}
                />
                <p className="mt-2 text-[11px] leading-tight text-muted-foreground">{PROCESS_GROUP_LABELS[key]}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm">
              <span className="font-mono text-2xl font-semibold">{total}</span>{" "}
              <span className="text-muted-foreground">months entered</span>
            </p>
            <Button size="sm" variant="secondary" asChild>
              <a href="#quiz">
                <ArrowUp aria-hidden className="size-4" /> Use in quiz
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {MILITARY_DUTIES.filter((duty) => selected.has(duty.id)).map((duty) => {
            const months = selections.find((item) => item.dutyId === duty.id)?.months ?? 0;
            return (
              <motion.div
                key={duty.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{duty.label}</h3>
                      <p className="text-xs text-subtle">{duty.examples}</p>
                    </div>
                    {duty.isProject ? (
                      <Badge variant="success">
                        <CircleCheck aria-hidden /> Project
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <CircleSlash aria-hidden /> Operations
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                    <Wand className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {duty.projectFraming}
                  </p>
                  <dl className="mt-4 space-y-2">
                    {GROUPS.map((key) => (
                      <div key={key} className="grid grid-cols-[8.5rem_1fr] gap-2 text-xs">
                        <dt className="font-medium text-foreground">{PROCESS_GROUP_LABELS[key]}</dt>
                        <dd className="text-muted-foreground">{duty.processGroups[key].join(" · ")}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {duty.pmiTerms.map((term) => (
                        <Badge key={term} variant="neutral">
                          {term}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`months-${duty.id}`} className="text-xs text-muted-foreground">
                        Months leading
                      </Label>
                      <Input
                        id={`months-${duty.id}`}
                        type="number"
                        min={0}
                        max={120}
                        inputMode="numeric"
                        className="h-8 w-20 font-mono"
                        value={months}
                        onChange={(event) => setMonths(duty.id, Math.max(0, Number(event.target.value) || 0))}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {selections.length > 0 ? (
        <p className="mt-4 text-xs text-subtle">
          Enter only months you were leading, and do not count the same calendar month twice: PMI counts overlapping
          projects once.
        </p>
      ) : null}
    </section>
  );
}
