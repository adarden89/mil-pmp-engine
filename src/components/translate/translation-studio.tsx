"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, Lock, RotateCcw, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@/components/providers/session-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { Field } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/form-controls";
import { apiFetch, loginHref } from "@/lib/api-client";
import { SAMPLE_REQUEST, SAMPLE_TRANSLATION } from "@/lib/sample-translation";
import {
  BRANCH_LABELS,
  BRANCHES,
  EVAL_SYSTEM_BY_BRANCH,
  translateRequestSchema,
  type Branch,
  type TranslateRequest,
  type TranslateResponse,
  type TranslationResult,
} from "@/lib/translation-schema";
import { cn } from "@/lib/utils";
import { TranslationResultView } from "./translation-result";

interface FormState {
  branch: Branch;
  rateOrMos: string;
  billet: string;
  projectTitle: string;
  startMonth: string;
  endMonth: string;
  teamSize: string;
  rawBullets: string;
  jstCourses: string;
}

const EMPTY: FormState = {
  branch: "navy",
  rateOrMos: "",
  billet: "",
  projectTitle: "",
  startMonth: "",
  endMonth: "",
  teamSize: "",
  rawBullets: "",
  jstCourses: "",
};

const STEPS = [
  { title: "Service profile", fields: ["branch", "rateOrMos", "billet"] },
  { title: "Project frame", fields: ["projectTitle", "startMonth", "endMonth", "teamSize"] },
  { title: "Evaluation bullets", fields: ["rawBullets", "jstCourses"] },
] as const satisfies readonly { title: string; fields: readonly (keyof FormState)[] }[];

const PROGRESS_MESSAGES = [
  "Reading your evaluation bullets",
  "Replacing military jargon with civilian terms",
  "Mapping your work to the five process groups",
  "Drafting first-person application text",
  "Flagging anything you should verify",
];

type Blocker = { kind: "signin" } | { kind: "purchase" } | null;

function toRequest(form: FormState): unknown {
  return {
    ...form,
    teamSize: form.teamSize.trim() === "" ? undefined : Number(form.teamSize),
    jstCourses: form.jstCourses.trim() === "" ? undefined : form.jstCourses,
  };
}

function fieldErrorsFor(form: FormState, fields: readonly (keyof FormState)[]): Record<string, string> {
  const parsed = translateRequestSchema.safeParse(toRequest(form));
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0]);
    if ((fields as readonly string[]).includes(key) && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function TranslationStudio() {
  const session = useSession();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [blocker, setBlocker] = useState<Blocker>(null);
  const [result, setResult] = useState<{
    translation: TranslationResult;
    input: TranslateRequest;
    sample: boolean;
  } | null>(null);
  const [remaining, setRemaining] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    if (!submitting) return;
    const timer = setInterval(() => setMessageIndex((index) => (index + 1) % PROGRESS_MESSAGES.length), 4000);
    return () => clearInterval(timer);
  }, [submitting]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function next() {
    const stepErrors = fieldErrorsFor(form, STEPS[step].fields);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = translateRequestSchema.safeParse(toRequest(form));
    if (!parsed.success) {
      const allErrors = fieldErrorsFor(form, Object.keys(EMPTY) as (keyof FormState)[]);
      setErrors(allErrors);
      const firstBadStep = STEPS.findIndex((s) => s.fields.some((field) => allErrors[field]));
      if (firstBadStep >= 0) setStep(firstBadStep);
      return;
    }

    setSubmitting(true);
    setMessageIndex(0);
    setRequestError(null);
    setBlocker(null);
    const response = await apiFetch<TranslateResponse>("/api/translate", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);

    if (response.ok) {
      setResult({ translation: response.data.translation, input: parsed.data, sample: false });
      setRemaining(response.data.usage);
      return;
    }
    if (response.status === 401) return setBlocker({ kind: "signin" });
    if (response.status === 402) return setBlocker({ kind: "purchase" });
    if (response.fieldErrors) {
      setErrors(Object.fromEntries(Object.entries(response.fieldErrors).map(([key, messages]) => [key, messages[0]])));
    }
    setRequestError(response.message);
  }

  function loadExample() {
    setForm({
      ...SAMPLE_REQUEST,
      teamSize: String(SAMPLE_REQUEST.teamSize ?? ""),
      jstCourses: SAMPLE_REQUEST.jstCourses ?? "",
    });
    setErrors({});
    setStep(2);
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setResult(null)} icon={<ArrowLeft className="size-4" aria-hidden />}>
            {result.sample ? "Back to the studio" : "Edit inputs"}
          </Button>
          <div className="flex items-center gap-3">
            {remaining ? (
              <Badge variant="neutral">
                {remaining.remaining} of {remaining.limit} translations left this period
              </Badge>
            ) : null}
            {!result.sample ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setForm(EMPTY);
                  setStep(0);
                }}
                icon={<RotateCcw className="size-4" aria-hidden />}
              >
                New project
              </Button>
            ) : null}
          </div>
        </div>
        <TranslationResultView result={result.translation} input={result.input} isSample={result.sample} />
      </div>
    );
  }

  const evalSystem = EVAL_SYSTEM_BY_BRANCH[form.branch];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden">
        <div className="flex border-b border-border">
          {STEPS.map((s, index) => (
            <button
              key={s.title}
              type="button"
              onClick={() => index < step && setStep(index)}
              disabled={index > step}
              className={cn(
                "flex-1 border-b-2 px-4 py-4 text-left transition-colors",
                index === step ? "border-brand" : index < step ? "border-success/60" : "border-transparent",
              )}
            >
              <span className="block font-mono text-[10px] tracking-widest text-subtle uppercase">
                Step {index + 1}
              </span>
              <span className={cn("block text-sm font-medium", index > step && "text-subtle")}>{s.title}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="p-6 sm:p-8" noValidate>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {step === 0 ? (
                <>
                  <fieldset>
                    <legend className="mb-3 text-sm font-medium">Branch of service</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {BRANCHES.map((branch) => (
                        <button
                          key={branch}
                          type="button"
                          onClick={() => update("branch", branch)}
                          aria-pressed={form.branch === branch}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            form.branch === branch
                              ? "border-brand bg-brand/10 text-fg"
                              : "border-border text-muted-foreground hover:border-border-strong",
                          )}
                        >
                          {BRANCH_LABELS[branch]}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <Field
                    label="Rate, MOS, or AFSC"
                    htmlFor="rateOrMos"
                    error={errors.rateOrMos}
                    hint="e.g. IT2 / Information Systems Technician, 25B, 3D0X2"
                  >
                    <Input
                      id="rateOrMos"
                      value={form.rateOrMos}
                      onChange={(e) => update("rateOrMos", e.target.value)}
                      aria-invalid={Boolean(errors.rateOrMos)}
                      maxLength={120}
                    />
                  </Field>
                  <Field
                    label="Billet or duty title"
                    htmlFor="billet"
                    error={errors.billet}
                    hint="The position you held during this project"
                  >
                    <Input
                      id="billet"
                      value={form.billet}
                      onChange={(e) => update("billet", e.target.value)}
                      aria-invalid={Boolean(errors.billet)}
                      maxLength={160}
                    />
                  </Field>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <Field
                    label="Working project title"
                    htmlFor="projectTitle"
                    error={errors.projectTitle}
                    hint="One temporary effort with a start and finish, not your whole tour"
                  >
                    <Input
                      id="projectTitle"
                      value={form.projectTitle}
                      onChange={(e) => update("projectTitle", e.target.value)}
                      aria-invalid={Boolean(errors.projectTitle)}
                      maxLength={160}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field label="Start month" htmlFor="startMonth" error={errors.startMonth}>
                      <Input
                        id="startMonth"
                        type="month"
                        value={form.startMonth}
                        onChange={(e) => update("startMonth", e.target.value)}
                        aria-invalid={Boolean(errors.startMonth)}
                      />
                    </Field>
                    <Field label="End month" htmlFor="endMonth" error={errors.endMonth}>
                      <Input
                        id="endMonth"
                        type="month"
                        value={form.endMonth}
                        onChange={(e) => update("endMonth", e.target.value)}
                        aria-invalid={Boolean(errors.endMonth)}
                      />
                    </Field>
                    <Field label="Team size (optional)" htmlFor="teamSize" error={errors.teamSize}>
                      <Input
                        id="teamSize"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={form.teamSize}
                        onChange={(e) => update("teamSize", e.target.value)}
                        aria-invalid={Boolean(errors.teamSize)}
                      />
                    </Field>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <Field
                  label={`Raw ${evalSystem} bullets`}
                  htmlFor="rawBullets"
                  error={errors.rawBullets}
                  hint="Paste the bullets about this project, including numbers you can verify. Remove anything classified, CUI, or personally identifying (names, SSNs, unit locations)."
                >
                  <Textarea
                    id="rawBullets"
                    rows={11}
                    className="resize-y font-mono text-[13px] leading-relaxed"
                    value={form.rawBullets}
                    onChange={(e) => update("rawBullets", e.target.value)}
                    aria-invalid={Boolean(errors.rawBullets)}
                    maxLength={6000}
                    placeholder={"- Led 8-person team to ...\n- Developed schedule for ...\n- Reduced ... by 30%"}
                  />
                  <p className="text-right font-mono text-[11px] text-subtle">{form.rawBullets.length} / 6000</p>
                </Field>
              ) : null}
              {step === 2 ? (
                <Field
                  label="Relevant JST training (optional)"
                  htmlFor="jstCourses"
                  error={errors.jstCourses}
                  hint="Leadership or management courses from your Joint Services Transcript. Used for context only, never presented as project experience."
                >
                  <Textarea
                    id="jstCourses"
                    rows={3}
                    className="resize-y text-[13px]"
                    value={form.jstCourses}
                    onChange={(e) => update("jstCourses", e.target.value)}
                    aria-invalid={Boolean(errors.jstCourses)}
                    maxLength={2000}
                    placeholder="e.g. Basic Leader Course; Petty Officer Selectee Leadership Course"
                  />
                </Field>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {requestError ? (
            <p
              className="mt-5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {requestError}
            </p>
          ) : null}

          {blocker ? <BlockerCard blocker={blocker} /> : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || submitting}
              onClick={() => setStep(step - 1)}
              icon={<ArrowLeft className="size-4" aria-hidden />}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                Continue <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button type="submit" loading={submitting} icon={<WandSparkles className="size-4" aria-hidden />}>
                Translate to PMI language
              </Button>
            )}
          </div>

          <AnimatePresence>
            {submitting ? (
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground"
                aria-live="polite"
              >
                <Sparkles className="size-3.5 text-brand" aria-hidden />
                {PROGRESS_MESSAGES[messageIndex]}… usually 20 to 60 seconds
              </motion.p>
            ) : null}
          </AnimatePresence>
        </form>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5">
          <p className="font-mono text-xs tracking-widest text-subtle uppercase">Try it first</p>
          <p className="mt-2 text-sm text-muted-foreground">
            See the full output format with example Navy bullets, no credit used.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setResult({ translation: SAMPLE_TRANSLATION, input: SAMPLE_REQUEST, sample: true })}
              icon={<Eye className="size-4" aria-hidden />}
            >
              View sample translation
            </Button>
            <Button variant="ghost" size="sm" onClick={loadExample}>
              Load example inputs
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-xs tracking-widest text-subtle uppercase">What PMI wants</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Objective, your role, deliverables, and outcome for each project.</li>
            <li>First-person statements about what you personally led.</li>
            <li>Civilian language a reviewer outside the military can follow.</li>
            <li>Only claims your supervisor would confirm in an audit.</li>
          </ul>
        </Card>
        {session.status === "ready" && !session.owns("base_tool") ? (
          <Card className="border-brand/30 p-5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Lock className="size-4 text-brand" aria-hidden /> Core Translator required
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              The sample is free. Live translations are included with the $24.99 Core Translator.
            </p>
            <LinkButton href="/#pricing" size="sm" className="mt-4 w-full">
              See pricing
            </LinkButton>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

function BlockerCard({ blocker }: { blocker: NonNullable<Blocker> }) {
  if (!blocker) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 p-4">
      <p className="text-sm">
        {blocker.kind === "signin"
          ? "Sign in to run live translations. Your inputs stay on this page."
          : "Live translations are part of the MilToPMP Core Translator."}
      </p>
      {blocker.kind === "signin" ? (
        <LinkButton href={loginHref("/translate")} size="sm">
          Sign in
        </LinkButton>
      ) : (
        <LinkButton href="/#pricing" size="sm">
          Get the Core Translator
        </LinkButton>
      )}
    </div>
  );
}
