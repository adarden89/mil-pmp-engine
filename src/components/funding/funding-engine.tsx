"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, CircleCheck, Clock, ExternalLink, FileText, TriangleAlert, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/form-controls";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FUNDING_PROGRAM_IDS,
  FUNDING_PROGRAMS,
  SHARED_RESOURCES,
  type FundingProgramId,
  type StepOwner,
} from "@/lib/funding-data";
import { cn } from "@/lib/utils";

const PROGRESS_KEY = "miltopmp:funding-progress";

const OWNER_TONE: Record<StepOwner, "brand" | "brass" | "success" | "neutral" | "warning"> = {
  You: "brand",
  Command: "brass",
  "Education Office": "warning",
  PMI: "success",
  "COOL Office": "neutral",
};

type ProgressState = Record<FundingProgramId, string[]>;

function loadProgress(): ProgressState {
  const empty = Object.fromEntries(FUNDING_PROGRAM_IDS.map((id) => [id, []])) as unknown as ProgressState;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<ProgressState>) } : empty;
  } catch {
    return empty;
  }
}

export function FundingEngine({
  branch,
  onBranchChange,
}: {
  branch: FundingProgramId;
  onBranchChange: (branch: FundingProgramId) => void;
}) {
  const program = FUNDING_PROGRAMS[branch];
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [expanded, setExpanded] = useState<string | null>(program.steps[0]?.id ?? null);

  useEffect(() => {
    // localStorage only exists in the browser, so progress is read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(loadProgress());
  }, []);

  const done = progress?.[branch] ?? [];
  const percent = Math.round((done.length / program.steps.length) * 100);

  function toggleDone(stepId: string) {
    setProgress((current) => {
      const base = current ?? loadProgress();
      const list = base[branch];
      const next = {
        ...base,
        [branch]: list.includes(stepId) ? list.filter((id) => id !== stepId) : [...list, stepId],
      };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        // Progress still tracks for this visit.
      }
      return next;
    });
  }

  return (
    <div>
      <Tabs
        value={branch}
        onValueChange={(value) => {
          const id = value as FundingProgramId;
          onBranchChange(id);
          setExpanded(FUNDING_PROGRAMS[id].steps[0]?.id ?? null);
        }}
      >
        <TabsList aria-label="Service">
          {FUNDING_PROGRAM_IDS.map((id) => (
            <TabsTrigger key={id} value={id}>
              {FUNDING_PROGRAMS[id].shortName}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-widest text-subtle uppercase">Workflow map</p>
              <h2 className="mt-1 text-2xl font-semibold">{program.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Requests are submitted in <span className="text-fg">{program.portalName}</span>
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={program.paymentModel === "reimbursement" ? "warning" : "success"}>
                  {program.paymentModel === "reimbursement" ? "Reimbursement" : "Program pays the fee"}
                </Badge>
                <span className="max-w-xl">{program.paymentNote}</span>
              </p>
            </div>
            <div className="w-full sm:w-48">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Your progress</span>
                <span className="font-mono">
                  {done.length}/{program.steps.length}
                </span>
              </div>
              <Progress value={percent} className="mt-2" tone={percent === 100 ? "success" : "brand"} />
            </div>
          </div>

          <ol className="relative mt-8">
            {program.steps.map((step, index) => {
              const isDone = done.includes(step.id);
              const isOpen = expanded === step.id;
              const isLast = index === program.steps.length - 1;
              return (
                <li key={step.id} className="relative pb-4 pl-12">
                  {!isLast ? (
                    <span
                      className={cn(
                        "absolute top-9 bottom-0 left-[15px] w-px",
                        isDone ? "bg-success/50" : "bg-border-strong",
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleDone(step.id)}
                    className={cn(
                      "absolute top-1 left-0 grid size-8 place-items-center rounded-full border font-mono text-xs transition-all",
                      isDone
                        ? "border-success bg-success text-white"
                        : "border-border-strong bg-bg-elevated text-muted-foreground hover:border-brand hover:text-brand",
                    )}
                    aria-label={isDone ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
                    aria-pressed={isDone}
                  >
                    {isDone ? <CircleCheck className="size-4" aria-hidden /> : index + 1}
                  </button>

                  <div
                    className={cn(
                      "rounded-xl border transition-colors",
                      isOpen ? "border-border-strong bg-bg-elevated/70" : "border-transparent",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : step.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left"
                    >
                      <span className="flex-1">
                        <span
                          className={cn(
                            "block text-sm font-semibold",
                            isDone && "text-muted-foreground line-through decoration-success/60",
                          )}
                        >
                          {step.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant={OWNER_TONE[step.owner]}>
                            <UserRound className="size-3" aria-hidden />
                            {step.owner}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-subtle">
                            <Clock className="size-3" aria-hidden />
                            {step.typicalDuration}
                          </span>
                        </span>
                      </span>
                      <ChevronRight
                        className={cn("size-4 text-subtle transition-transform", isOpen && "rotate-90")}
                        aria-hidden
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 px-3 pb-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                            {step.documents.length > 0 ? (
                              <ul className="space-y-1.5">
                                {step.documents.map((doc) => (
                                  <li key={doc} className="flex items-center gap-2 text-xs text-fg">
                                    <FileText className="size-3.5 text-brand" aria-hidden />
                                    {doc}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <p className="font-mono text-xs tracking-widest text-subtle uppercase">Eligibility checklist</p>
            <ul className="mt-4 space-y-3">
              {program.eligibilityHighlights.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={program.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              Confirm on {program.shortName} <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Card>
          <Card className="border-warning/25 p-6">
            <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-warning uppercase">
              <TriangleAlert className="size-3.5" aria-hidden /> Watch outs
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {program.watchOuts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <p className="font-mono text-xs tracking-widest text-subtle uppercase">Official sources</p>
            <ul className="mt-4 space-y-2">
              {SHARED_RESOURCES.map((resource) => (
                <li key={resource.href}>
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-fg"
                  >
                    {resource.label} <ExternalLink className="size-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-subtle">
              Program rules change each fiscal year. Confirm current requirements with your Education Services Officer
              before you submit.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
