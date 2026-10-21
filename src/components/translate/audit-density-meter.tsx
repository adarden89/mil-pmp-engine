"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { AuditDensityReport, CheckStatus } from "@/lib/audit-density";
import { cn } from "@/lib/utils";

const GRADE_COLOR: Record<AuditDensityReport["grade"], string> = {
  audit_ready: "var(--success)",
  needs_work: "var(--warning)",
  high_risk: "var(--danger)",
};

const STATUS_ICON: Record<CheckStatus, typeof CircleCheck> = {
  pass: CircleCheck,
  warn: CircleAlert,
  fail: CircleX,
};

const STATUS_CLASS: Record<CheckStatus, string> = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-danger",
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AuditDensityMeter({ report }: { report: AuditDensityReport }) {
  const reduceMotion = useReducedMotion();
  const color = GRADE_COLOR[report.grade];
  const offset = CIRCUMFERENCE * (1 - report.score / 100);

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div
        className="relative mx-auto size-36"
        role="img"
        aria-label={`Audit readiness ${report.score} out of 100: ${report.gradeLabel}`}
      >
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: reduceMotion ? offset : CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-mono text-4xl font-semibold tracking-tight">{report.score}</p>
            <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color }}>
              {report.gradeLabel}
            </p>
          </div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {report.checks.map((check) => {
          const Icon = STATUS_ICON[check.status];
          return (
            <li key={check.id} className="flex gap-2.5">
              <Icon className={cn("mt-0.5 size-4 shrink-0", STATUS_CLASS[check.status])} aria-label={check.status} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{check.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
