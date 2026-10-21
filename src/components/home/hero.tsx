"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, CircleCheck, Gauge, Landmark, Languages, ShieldCheck, Target } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PIPELINE = [
  { icon: Target, label: "Eligibility", detail: "CAPM vs. PMP decided", state: "done" },
  { icon: Landmark, label: "COOL funding", detail: "Voucher packet ready", state: "done" },
  { icon: Languages, label: "Translation", detail: "4 projects at 86+ audit score", state: "active" },
  { icon: BookOpen, label: "Study vault", detail: "Process domain at 72%", state: "queued" },
  { icon: ShieldCheck, label: "Exam day", detail: "Book within voucher window", state: "queued" },
] as const;

const STATS = [
  { value: "5", label: "Service COOL workflows mapped" },
  { value: "3", label: "Questions to your CAPM / PMP path" },
  { value: "$0", label: "Out of pocket for the exam once funding is approved" },
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const fadeUp = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid mask-fade-b absolute inset-0" aria-hidden />
      <div className="bg-radial-glow absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-24 lg:pb-28">
        <div>
          <motion.div {...fadeUp(0)}>
            <Badge variant="brass" className="font-mono tracking-wide">
              E-1 to E-9 · Officers · Every branch
            </Badge>
          </motion.div>
          <motion.h1
            {...fadeUp(0.08)}
            className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl"
          >
            From your first billet to <span className="text-gradient">PMI certified</span>, funded by benefits you
            already earned.
          </motion.h1>
          <motion.p
            {...fadeUp(0.16)}
            className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground"
          >
            Zero project management background required. Find out in under a minute whether the CAPM or the PMP fits
            you, get the exam funded through Navy COOL, Army IgnitED, or AF COOL with $0 out of pocket, and turn your
            evaluations into PMI-ready experience that holds up in an audit.
          </motion.p>
          <motion.div {...fadeUp(0.24)} className="mt-9 flex flex-wrap items-center gap-3">
            <LinkButton href="/eligibility" size="lg" icon={<ArrowRight className="size-4" aria-hidden />}>
              Check my eligibility
            </LinkButton>
            <LinkButton href="/funding" size="lg" variant="secondary">
              See the funding map
            </LinkButton>
          </motion.div>
          <motion.dl {...fadeUp(0.32)} className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-8">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{stat.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div
            className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand/20 via-transparent to-brand-2/20 blur-2xl"
            aria-hidden
          />
          <div className="relative rounded-2xl border border-border-strong bg-surface/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-subtle uppercase">Certification pipeline</p>
                <p className="mt-1 text-sm font-medium">Sample member: IT2, 6 years of service</p>
              </div>
              <Badge variant="success">
                <Gauge className="size-3" aria-hidden /> On track
              </Badge>
            </div>
            <ol className="mt-6 space-y-3">
              {PIPELINE.map((step, index) => (
                <motion.li
                  key={step.label}
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + index * 0.08, duration: 0.4 }}
                  className="flex items-center gap-4 rounded-xl border border-border bg-bg-elevated/70 px-4 py-3"
                >
                  <span
                    className={
                      step.state === "done"
                        ? "grid size-9 place-items-center rounded-lg bg-success/15 text-success"
                        : step.state === "active"
                          ? "grid size-9 place-items-center rounded-lg bg-brand/15 text-brand"
                          : "grid size-9 place-items-center rounded-lg bg-surface-2 text-subtle"
                    }
                  >
                    <step.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                  {step.state === "done" ? (
                    <CircleCheck className="size-4 text-success" aria-label="Complete" />
                  ) : step.state === "active" ? (
                    <span className="font-mono text-[10px] tracking-widest text-brand uppercase">Active</span>
                  ) : (
                    <span className="font-mono text-[10px] tracking-widest text-subtle uppercase">Queued</span>
                  )}
                </motion.li>
              ))}
            </ol>
            <p className="mt-5 text-[11px] leading-relaxed text-subtle">
              Illustrative example. Your plan is built from your own eligibility answers.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
