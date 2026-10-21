"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  GraduationCap,
  Medal,
  RotateCcw,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import {
  assessEligibility,
  EDUCATION_LABELS,
  EDUCATION_LEVELS,
  RANK_BANDS,
  RANK_LABELS,
  SERVICE_BANDS,
  SERVICE_LABELS,
  type EligibilityInput,
  type EligibilityResult,
} from "@/lib/eligibility";
import { ELIGIBILITY_STORAGE_KEY } from "@/lib/storage-keys";
import { cn } from "@/lib/utils";

type Answers = Partial<EligibilityInput>;

interface Option<T extends string> {
  value: T;
  label: string;
  detail?: string;
}

interface StepDefinition {
  key: keyof EligibilityInput;
  icon: LucideIcon;
  question: string;
  options: readonly Option<string>[];
}

const STEPS = [
  {
    key: "rank",
    icon: Medal,
    question: "What is your current pay grade?",
    options: RANK_BANDS.map((value) => ({ value, ...RANK_LABELS[value] })),
  },
  {
    key: "service",
    icon: Timer,
    question: "How long have you served?",
    options: SERVICE_BANDS.map((value) => ({ value, label: SERVICE_LABELS[value] })),
  },
  {
    key: "education",
    icon: GraduationCap,
    question: "What is your highest completed education?",
    options: EDUCATION_LEVELS.map((value) => ({ value, ...EDUCATION_LABELS[value] })),
  },
] as const satisfies readonly StepDefinition[];

const RECOMMENDATION_LABEL: Record<EligibilityResult["recommendation"], string> = {
  PMP: "PMP",
  CAPM_THEN_PMP: "CAPM → PMP",
  CAPM: "CAPM",
};

const CONFIDENCE_TONE = { strong: "success", borderline: "warning", not_yet: "brand" } as const;
const CONFIDENCE_LABEL = { strong: "Strong fit", borderline: "Borderline", not_yet: "Build experience first" } as const;

function isComplete(answers: Answers): answers is EligibilityInput {
  return Boolean(answers.rank && answers.service && answers.education);
}

export function EligibilityCalculator() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<EligibilityResult | null>(null);

  function choose(value: string) {
    const current = STEPS[step];
    const next = { ...answers, [current.key]: value } as Answers;
    setAnswers(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    if (isComplete(next)) {
      const assessed = assessEligibility(next);
      setResult(assessed);
      try {
        localStorage.setItem(ELIGIBILITY_STORAGE_KEY, JSON.stringify({ input: next, result: assessed }));
      } catch {
        // Storage unavailable: the result still shows; the dashboard just won't remember it.
      }
    }
  }

  function reset() {
    setAnswers({});
    setResult(null);
    setStep(0);
  }

  const current = STEPS[step];
  const selected = answers[current.key];
  const slide = {
    initial: reduceMotion ? false : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: reduceMotion ? undefined : { opacity: 0, x: -24 },
    transition: { duration: 0.25 },
  };

  return (
    <section id="eligibility" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Eligibility calculator"
        title="CAPM or PMP? Know in three questions."
        description="PMI does not count rank or time in service. It counts months spent leading projects. This estimate is deliberately conservative, so a 'go' here is a go you can defend in an audit."
      />

      <Card className="mx-auto mt-12 max-w-4xl overflow-hidden">
        <div className="border-b border-border px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs tracking-widest text-subtle uppercase">
              {result ? "Your recommendation" : `Question ${step + 1} of ${STEPS.length}`}
            </p>
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((s, index) => (
                <span
                  key={s.key}
                  className={cn(
                    "h-1.5 w-10 rounded-full transition-colors duration-300",
                    result || index < step ? "bg-brand" : index === step ? "bg-brand/50" : "bg-surface-2",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-[380px] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {result && isComplete(answers) ? (
              <motion.div key="result" {...slide}>
                <EligibilityResultPanel result={result} onReset={reset} />
              </motion.div>
            ) : (
              <motion.fieldset key={current.key} {...slide}>
                <legend className="flex items-center gap-3 text-xl font-semibold sm:text-2xl">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                    <current.icon className="size-5" aria-hidden />
                  </span>
                  {current.question}
                </legend>
                <div
                  className={cn(
                    "mt-8 grid gap-3",
                    current.options.length > 5 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3",
                  )}
                >
                  {current.options.map((option: Option<string>) => {
                    const isSelected = selected === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => choose(option.value)}
                        aria-pressed={isSelected}
                        className={cn(
                          "group relative rounded-xl border px-4 py-4 text-left transition-all duration-200",
                          isSelected
                            ? "border-brand bg-brand/10"
                            : "border-border bg-bg-elevated/60 hover:-translate-y-0.5 hover:border-border-strong",
                        )}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        {option.detail ? <span className="mt-1 block text-xs text-muted">{option.detail}</span> : null}
                        {isSelected ? <Check className="absolute top-3 right-3 size-4 text-brand" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
                {step > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-8"
                    onClick={() => setStep(step - 1)}
                    icon={<ArrowLeft className="size-4" aria-hidden />}
                  >
                    Back
                  </Button>
                ) : null}
              </motion.fieldset>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </section>
  );
}

function EligibilityResultPanel({ result, onReset }: { result: EligibilityResult; onReset: () => void }) {
  const percent = Math.min(100, Math.round((result.estimatedLeadershipMonths / result.requiredMonths) * 100));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={CONFIDENCE_TONE[result.confidence]}>{CONFIDENCE_LABEL[result.confidence]}</Badge>
          <Badge tone="neutral">{result.educationHoursRequired} contact hours needed</Badge>
        </div>
        <p className="text-gradient mt-5 font-mono text-5xl font-semibold tracking-tight">
          {RECOMMENDATION_LABEL[result.recommendation]}
        </p>
        <h3 className="mt-3 text-xl font-semibold">{result.headline}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{result.rationale}</p>

        <div className="mt-6 rounded-xl border border-border bg-bg-elevated/60 p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Estimated PM leadership</span>
            <span className="font-mono font-medium">
              {result.estimatedLeadershipMonths} / {result.requiredMonths} mo
            </span>
          </div>
          <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-2 text-xs text-subtle">
            PMI threshold for your education level. Only the last 8 years count.
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        <p className="font-mono text-xs tracking-widest text-subtle uppercase">Next steps</p>
        <ol className="mt-4 space-y-3">
          {result.nextSteps.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/10 font-mono text-xs text-brand">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <LinkButton href="/#pricing" icon={<Award className="size-4" aria-hidden />}>
            Get the Base Tool
          </LinkButton>
          <LinkButton href="/funding" variant="secondary" icon={<ArrowRight className="size-4" aria-hidden />}>
            Map my funding
          </LinkButton>
          <Button variant="ghost" onClick={onReset} icon={<RotateCcw className="size-4" aria-hidden />}>
            Start over
          </Button>
        </div>
      </div>
    </div>
  );
}
