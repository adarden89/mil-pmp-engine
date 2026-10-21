"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Flag, GraduationCap, Medal, Timer, Wand } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form-controls";
import { totalMapperMonths } from "@/lib/accidental-pm";
import {
  EDUCATION_LABELS,
  EDUCATION_LEVELS,
  EXPERIENCE_WINDOW_MONTHS,
  RANK_BANDS,
  RANK_LABELS,
  type EducationLevel,
  type EligibilityInput,
  type RankBand,
} from "@/lib/eligibility";
import { BRANCH_LABELS, BRANCHES, type Branch } from "@/lib/translation-schema";
import { cn } from "@/lib/utils";
import { planStore, usePlan } from "./plan-store";

/** One question per step; single-choice steps advance as soon as the member picks. */
const STEPS = [
  { icon: Flag, title: "Branch" },
  { icon: Medal, title: "Pay grade" },
  { icon: GraduationCap, title: "Education" },
  { icon: Timer, title: "Experience" },
] as const;

interface Draft {
  branch: Branch | null;
  rank: RankBand | null;
  education: EducationLevel | null;
  leadershipMonths: number;
  serving: boolean;
  separatedOn: string;
}

function OptionButton({
  selected,
  label,
  detail,
  onClick,
}: {
  selected: boolean;
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-bg-elevated/60 hover:-translate-y-0.5 hover:border-border-strong",
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      {detail ? <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span> : null}
      {selected ? <Check className="absolute top-3 right-3 size-4 text-primary" aria-hidden /> : null}
    </button>
  );
}

export function EligibilityQuiz({ onComplete }: { onComplete: (input: EligibilityInput) => void }) {
  const reduceMotion = useReducedMotion();
  const plan = usePlan();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => ({
    branch: plan.input?.branch ?? null,
    rank: plan.input?.rank ?? null,
    education: plan.input?.education ?? null,
    leadershipMonths: plan.input?.leadershipMonths ?? 0,
    serving: !plan.input?.separatedOn,
    separatedOn: plan.input?.separatedOn ?? "",
  }));
  const mapperMonths = totalMapperMonths(plan.mapper);

  const canContinue = [Boolean(draft.branch), Boolean(draft.rank), Boolean(draft.education), true][step];

  function choose(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }
  const separationMissing = !draft.serving && !/^\d{4}-(0[1-9]|1[0-2])$/.test(draft.separatedOn);

  function submit() {
    if (!draft.branch || !draft.rank || !draft.education || separationMissing) return;
    const input: EligibilityInput = {
      branch: draft.branch,
      rank: draft.rank,
      education: draft.education,
      leadershipMonths: Math.max(0, Math.round(draft.leadershipMonths)),
      separatedOn: draft.serving ? null : draft.separatedOn,
    };
    planStore.setInput(input);
    onComplete(input);
  }

  const slide = {
    initial: reduceMotion ? false : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: reduceMotion ? undefined : { opacity: 0, x: -24 },
    transition: { duration: 0.22 },
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex border-b border-border">
        {STEPS.map((item, index) => (
          <div
            key={item.title}
            className={cn(
              "flex flex-1 items-center gap-2 border-b-2 px-4 py-4 text-sm",
              index === step
                ? "border-primary text-foreground"
                : index < step
                  ? "border-success/60 text-muted-foreground"
                  : "border-transparent text-subtle",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span className="hidden font-medium sm:inline">{item.title}</span>
            <span className="font-mono text-[11px] sm:hidden">
              {index + 1}/{STEPS.length}
            </span>
          </div>
        ))}
      </div>

      <div className="min-h-[360px] p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} {...slide} className="space-y-7">
            {step === 0 ? (
              <fieldset>
                <legend className="text-lg font-semibold">Branch of service</legend>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BRANCHES.map((branch) => (
                    <OptionButton
                      key={branch}
                      selected={draft.branch === branch}
                      label={BRANCH_LABELS[branch].replace("U.S. ", "")}
                      onClick={() => choose({ branch })}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            {step === 1 ? (
              <fieldset>
                <legend className="text-lg font-semibold">Pay grade</legend>
                <p className="mt-1 text-sm text-muted-foreground">
                  PMI never looks at rank. We use it to suggest where to start.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {RANK_BANDS.map((rank) => (
                    <OptionButton
                      key={rank}
                      selected={draft.rank === rank}
                      label={RANK_LABELS[rank].label}
                      detail={RANK_LABELS[rank].detail}
                      onClick={() => choose({ rank })}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            {step === 2 ? (
              <fieldset>
                <legend className="text-lg font-semibold">Highest completed education</legend>
                <p className="mt-1 text-sm text-muted-foreground">
                  This sets how many months of project leadership PMI requires for the PMP.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {EDUCATION_LEVELS.map((education) => (
                    <OptionButton
                      key={education}
                      selected={draft.education === education}
                      label={EDUCATION_LABELS[education].label}
                      detail={EDUCATION_LABELS[education].detail}
                      onClick={() => choose({ education })}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            {step === 3 ? (
              <div>
                <Label htmlFor="leadershipMonths" className="text-lg font-semibold">
                  Months spent leading projects in the last 10 years
                </Label>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Not your total time in service. Count months where you led or directed a defined effort: an exercise,
                  an inspection workup, a move, an install. Overlapping projects count once. Zero is a perfectly good
                  answer: it routes you to the CAPM.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-5">
                  <input
                    type="range"
                    min={0}
                    max={120}
                    step={1}
                    value={draft.leadershipMonths}
                    onChange={(event) => setDraft({ ...draft, leadershipMonths: Number(event.target.value) })}
                    className="h-2 w-full max-w-md cursor-pointer accent-[var(--brand)]"
                    aria-label="Months leading projects"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      id="leadershipMonths"
                      type="number"
                      min={0}
                      max={600}
                      inputMode="numeric"
                      className="w-24 font-mono"
                      value={draft.leadershipMonths}
                      onChange={(event) => setDraft({ ...draft, leadershipMonths: Number(event.target.value) || 0 })}
                    />
                    <span className="text-sm text-muted-foreground">months</span>
                  </div>
                </div>
                {draft.leadershipMonths > EXPERIENCE_WINDOW_MONTHS ? (
                  <p className="mt-3 text-xs text-warning">
                    PMI only counts the last {EXPERIENCE_WINDOW_MONTHS} months, so anything above that is ignored.
                  </p>
                ) : null}
                <fieldset className="mt-7">
                  <legend className="text-sm font-semibold">Are you still on active duty?</legend>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Veterans lose countable months as their service ages out of PMI&apos;s 10-year window.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <OptionButton
                      selected={draft.serving}
                      label="Still serving"
                      onClick={() => setDraft({ ...draft, serving: true })}
                    />
                    <OptionButton
                      selected={!draft.serving}
                      label="I have separated"
                      onClick={() => setDraft({ ...draft, serving: false })}
                    />
                    {!draft.serving ? (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="separatedOn" className="text-sm text-muted-foreground">
                          Separation month
                        </Label>
                        <Input
                          id="separatedOn"
                          type="month"
                          className="w-44"
                          value={draft.separatedOn}
                          onChange={(event) => setDraft({ ...draft, separatedOn: event.target.value })}
                          aria-invalid={separationMissing}
                        />
                      </div>
                    ) : null}
                  </div>
                </fieldset>
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-elevated/60 p-4 text-sm">
                  <Wand className="size-4 text-primary" aria-hidden />
                  {mapperMonths > 0 ? (
                    <>
                      <span>
                        Your Accidental PM Mapper adds up to <strong>{mapperMonths} months</strong>.
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDraft({ ...draft, leadershipMonths: mapperMonths })}
                      >
                        Use {mapperMonths} months
                      </Button>
                    </>
                  ) : (
                    <span>
                      Not sure? The{" "}
                      <a href="#mapper" className="font-medium text-primary hover:underline">
                        Accidental PM Mapper
                      </a>{" "}
                      below finds the projects hiding in your duties.
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            icon={<ArrowLeft className="size-4" aria-hidden />}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button onClick={submit} disabled={separationMissing}>
              Build my roadmap <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
