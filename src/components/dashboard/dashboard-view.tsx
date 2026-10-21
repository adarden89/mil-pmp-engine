"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Landmark,
  Languages,
  Lock,
  LockOpen,
  PartyPopper,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlan, usePlanSync } from "@/components/eligibility/plan-store";
import { useSession } from "@/components/providers/session-provider";
import { usePurchase } from "@/components/providers/use-purchase";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PRODUCTS, type ProductId } from "@/lib/catalog";
import { assessEligibility } from "@/lib/eligibility";
import { buildRoadmap, currentPhase, roadmapProgress } from "@/lib/roadmap";
import { Progress } from "@/components/ui/form-controls";
import { cn, formatUsd } from "@/lib/utils";

interface ModuleTile {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  requires: ProductId | null;
}

const MODULES: ModuleTile[] = [
  {
    title: "Eligibility & roadmap",
    description: "Your CAPM or PMP path and step-by-step plan.",
    href: "/eligibility",
    icon: Target,
    requires: null,
  },
  {
    title: "Translation Studio",
    description: "Turn evaluation bullets into PMI project text.",
    href: "/translate",
    icon: Languages,
    requires: "base_tool",
  },
  {
    title: "Navy COOL Fast-Track Guide",
    description: "OPNAV 1500/57 prep packet and JST checklist.",
    href: "/funding#opnav-1500-57",
    icon: Landmark,
    requires: "cool_fast_track",
  },
  {
    title: "Study Vault",
    description: "Full flashcard deck with synced retention.",
    href: "/vault",
    icon: BookOpen,
    requires: "exam_vault",
  },
];

export function DashboardView({
  email,
  serverEntitlements,
  welcome,
}: {
  email: string | null;
  serverEntitlements: ProductId[];
  welcome: ProductId | null;
}) {
  const session = useSession();
  const purchase = usePurchase();
  const [showWelcome, setShowWelcome] = useState(Boolean(welcome));
  usePlanSync();
  const plan = usePlan();
  const eligibility = useMemo(() => (plan.input ? assessEligibility(plan.input) : null), [plan.input]);
  const roadmap = useMemo(
    () => (plan.input && eligibility ? buildRoadmap(eligibility, plan.input.branch) : null),
    [plan.input, eligibility],
  );
  const progress = roadmap ? roadmapProgress(roadmap, plan.completed) : null;
  const focus = roadmap ? currentPhase(roadmap, plan.completed) : null;

  // Server data renders first; client state takes over after a 1-click purchase refresh.
  const owned = session.status === "ready" && session.signedIn ? session.entitlements : serverEntitlements;
  const owns = (id: ProductId) => owned.includes(id);
  const missingAddons = (["cool_fast_track", "exam_vault"] as const).filter((id) => !owns(id));

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {showWelcome && welcome ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="border-gradient flex flex-wrap items-center gap-4 rounded-2xl p-5"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-success/15 text-success">
              <PartyPopper className="size-5" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-semibold">{PRODUCTS[welcome].name} is unlocked.</p>
              <p className="text-sm text-muted-foreground">
                Your receipt is on its way from Stripe. Here is where to start.
              </p>
            </div>
            <LinkButton href={PRODUCTS[welcome].unlocksPath} icon={<ArrowRight className="size-4" aria-hidden />}>
              Start now
            </LinkButton>
            <button type="button" className="text-xs text-subtle hover:text-fg" onClick={() => setShowWelcome(false)}>
              Dismiss
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6 sm:p-8">
          <p className="font-mono text-xs tracking-widest text-subtle uppercase">Signed in as</p>
          <p className="mt-1 text-lg font-semibold">{email ?? "Service member"}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {MODULES.map((module) => {
              const unlocked = module.requires === null || owns(module.requires);
              return (
                <Link
                  key={module.title}
                  href={unlocked ? module.href : "/#pricing"}
                  className={cn(
                    "group rounded-xl border p-5 transition-all",
                    unlocked
                      ? "border-border hover:-translate-y-0.5 hover:border-border-strong"
                      : "border-dashed border-border opacity-70",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-lg",
                        unlocked ? "bg-brand/10 text-brand" : "bg-surface-2 text-subtle",
                      )}
                    >
                      <module.icon className="size-4" aria-hidden />
                    </span>
                    {unlocked ? (
                      <LockOpen className="size-4 text-success" aria-label="Unlocked" />
                    ) : (
                      <Lock className="size-4 text-subtle" aria-label="Locked" />
                    )}
                  </div>
                  <p className="mt-4 text-sm font-semibold">{module.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{module.description}</p>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-xs tracking-widest text-subtle uppercase">Your path</p>
          {eligibility && progress ? (
            <>
              <p className="text-gradient mt-3 font-mono text-4xl font-semibold">{eligibility.path}</p>
              <p className="mt-2 text-sm font-medium">{eligibility.headline}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {eligibility.countedMonths} of {eligibility.requiredPmpMonths} months of project leadership toward the
                PMP. {eligibility.educationHours} contact hours of PM education required.
              </p>
              <div className="mt-6 flex justify-between text-xs text-muted-foreground">
                <span>Roadmap progress</span>
                <span className="font-mono">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <Progress
                value={progress.percent}
                className="mt-2"
                tone={progress.percent === 100 ? "success" : "brand"}
              />
              {focus ? (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="size-3.5 text-primary" aria-hidden /> Current focus: {focus.title}
                </p>
              ) : null}
              <LinkButton
                href="/eligibility"
                size="sm"
                variant="secondary"
                className="mt-5"
                icon={<ArrowRight className="size-4" aria-hidden />}
              >
                Open my roadmap
              </LinkButton>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                Answer three questions to get your CAPM or PMP path and a roadmap you can track here.
              </p>
              <LinkButton href="/eligibility" size="sm" variant="secondary" className="mt-4">
                Check eligibility
              </LinkButton>
            </>
          )}
        </Card>
      </div>

      {!owns("base_tool") ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-semibold">Unlock the MilToPMP Core Translator</p>
            <p className="text-sm text-muted-foreground">{PRODUCTS.base_tool.headline}</p>
          </div>
          <LinkButton href="/#pricing">Get it for {formatUsd(PRODUCTS.base_tool.priceCents)}</LinkButton>
        </Card>
      ) : missingAddons.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {missingAddons.map((id) => (
            <Card key={id} className="flex flex-col p-6">
              <Badge variant="brass" className="self-start">
                1-click add-on
              </Badge>
              <p className="mt-3 font-semibold">{PRODUCTS[id].name}</p>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{PRODUCTS[id].headline}</p>
              <Button
                variant="brass"
                className="mt-5"
                loading={purchase.pending === id}
                onClick={() => purchase.oneClick(id)}
                icon={<Zap className="size-4" aria-hidden />}
              >
                Add for {formatUsd(PRODUCTS[id].priceCents)}, charged to your saved card
              </Button>
            </Card>
          ))}
        </div>
      ) : null}
      {purchase.error ? (
        <p className="text-sm text-danger" role="alert">
          {purchase.error}
        </p>
      ) : null}
      {purchase.notice ? <p className="text-sm text-success">{purchase.notice}</p> : null}
    </div>
  );
}
