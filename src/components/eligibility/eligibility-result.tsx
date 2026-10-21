"use client";

import { motion } from "framer-motion";
import { Award, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BRANCH_PORTALS } from "@/lib/pmi-facts";
import type { EligibilityInput, EligibilityResult, NoteTone } from "@/lib/eligibility";

const NOTE_ICON: Record<NoteTone, typeof Info> = { info: Info, warning: TriangleAlert, critical: OctagonAlert };
const NOTE_VARIANT = { info: "info", warning: "warning", critical: "critical" } as const;

export function EligibilityResultView({ input, result }: { input: EligibilityInput; result: EligibilityResult }) {
  const percent = Math.min(100, Math.round((result.countedMonths / result.requiredPmpMonths) * 100));
  const portal = BRANCH_PORTALS[input.branch];

  return (
    <Card className="p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">{result.educationHours} contact hours</Badge>
            <Badge variant="neutral">
              Exam fee ${result.examFee.member}–${result.examFee.nonMember}, voucher-funded
            </Badge>
          </div>
          <p className="mt-5 flex items-center gap-3 font-mono text-6xl font-semibold tracking-tight">
            <Award className="size-10 text-brass" aria-hidden />
            <span className="text-gradient">{result.path}</span>
          </p>
          <h2 className="mt-3 text-2xl font-semibold">{result.headline}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.rationale}</p>

          <div className="mt-6 rounded-xl border border-border bg-bg-elevated/60 p-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Project leadership toward the PMP</span>
              <span className="font-mono font-medium">
                {result.countedMonths} / {result.requiredPmpMonths} mo
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-brand-2"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-2 text-xs text-subtle">
              Funding portal for your branch:{" "}
              <a href={portal.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {portal.name}
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {result.notes.map((note) => {
            const Icon = NOTE_ICON[note.tone];
            return (
              <Alert key={note.text} variant={NOTE_VARIANT[note.tone]}>
                <Icon aria-hidden />
                <AlertDescription className="text-foreground">{note.text}</AlertDescription>
              </Alert>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
