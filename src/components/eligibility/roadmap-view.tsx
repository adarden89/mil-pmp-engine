"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Lock, Target } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox, Progress } from "@/components/ui/form-controls";
import { currentPhase, roadmapProgress, type Roadmap } from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { planStore, usePlan } from "./plan-store";

export function RoadmapView({ roadmap }: { roadmap: Roadmap }) {
  const plan = usePlan();
  const progress = roadmapProgress(roadmap, plan.completed);
  const focus = currentPhase(roadmap, plan.completed);

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-subtle uppercase">Beginner-to-certified roadmap</p>
          <h2 className="mt-1 text-2xl font-semibold">Your {roadmap.path} plan</h2>
          {focus ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="size-4 text-primary" aria-hidden /> Current focus: {focus.title}
            </p>
          ) : (
            <p className="mt-1 text-sm text-success">Every step complete. Congratulations.</p>
          )}
        </div>
        <div className="w-full sm:w-56">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-mono">
              {progress.done}/{progress.total}
            </span>
          </div>
          <Progress value={progress.percent} className="mt-2" tone={progress.percent === 100 ? "success" : "brand"} />
        </div>
      </div>

      <ol className="mt-8 grid gap-4 lg:grid-cols-2">
        {roadmap.phases.map((phase, index) => {
          const isFocus = focus?.id === phase.id;
          const phaseDone = phase.tasks.every((task) => plan.completed.includes(task.id));
          return (
            <motion.li
              key={phase.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-xl border p-5 transition-colors",
                isFocus ? "border-primary/50 bg-primary/5" : "border-border bg-bg-elevated/50",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full font-mono text-xs",
                      phaseDone
                        ? "bg-success text-white"
                        : isFocus
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-semibold">{phase.title}</h3>
                </div>
                <span className="font-mono text-[11px] text-subtle">{phase.timeframe}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {phase.tasks.map((task) => {
                  const done = plan.completed.includes(task.id);
                  return (
                    <li key={task.id} className="flex gap-3">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={done}
                        onCheckedChange={() => planStore.toggleTask(task.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`task-${task.id}`}
                          className={cn(
                            "cursor-pointer text-sm font-medium",
                            done && "text-muted-foreground line-through",
                          )}
                        >
                          {task.title}
                        </label>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{task.detail}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {task.blockedUntilVoucher ? (
                            <Badge variant="danger">
                              <Lock aria-hidden /> Only after voucher approval
                            </Badge>
                          ) : null}
                          {task.href ? (
                            task.href.startsWith("http") ? (
                              <a
                                href={task.href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                Open <ArrowUpRight className="size-3" aria-hidden />
                              </a>
                            ) : (
                              <Link href={task.href} className="text-xs font-medium text-primary hover:underline">
                                Go there
                              </Link>
                            )
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.li>
          );
        })}
      </ol>
    </Card>
  );
}
