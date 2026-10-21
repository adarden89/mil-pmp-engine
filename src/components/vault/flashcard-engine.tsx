"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo, type Variants } from "framer-motion";
import { Keyboard, Lock, RotateCcw, Shuffle, ThumbsDown, ThumbsUp, Trophy, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ProgressResponse } from "@/app/api/flashcards/progress/route";
import { useSession } from "@/components/providers/session-provider";
import { usePurchase } from "@/components/providers/use-purchase";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/form-controls";
import { apiFetch } from "@/lib/api-client";
import { PRODUCTS } from "@/lib/catalog";
import {
  cardsForAccess,
  CAPM_WEIGHT,
  CATEGORIES,
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  DOMAIN_LABELS,
  DOMAINS,
  PMP_DOMAIN_WEIGHT,
  FLASHCARDS,
  type Category,
  type Flashcard,
} from "@/lib/flashcards";
import { buildStudyQueue, mergeProgress, reviewCard, summarizeRetention, type ProgressMap } from "@/lib/leitner";
import { cn, formatUsd } from "@/lib/utils";
import { progressStore } from "./progress-store";

type CategoryFilter = Category | "all";

const SWIPE_THRESHOLD = 110;

/** `custom` from AnimatePresence is the exit direction: 1 = got it (right), -1 = missed (left). */
const CARD_VARIANTS: Variants = {
  enter: { opacity: 0, y: 24, scale: 0.96 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * 320,
    rotate: direction * 14,
    transition: { duration: 0.3 },
  }),
};
const noopSubscribe = () => () => {};

export function FlashcardEngine() {
  const session = useSession();
  const purchase = usePurchase();
  const hasVault = session.owns("exam_vault");
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sessionNonce, setSessionNonce] = useState(0);

  // Pull server progress once for vault owners and merge it with this device.
  useEffect(() => {
    if (!hasVault) return;
    let cancelled = false;
    void apiFetch<ProgressResponse>("/api/flashcards/progress").then((result) => {
      if (!cancelled && result.ok) {
        progressStore.replace(mergeProgress(progressStore.getSnapshot(), result.data.progress));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hasVault]);

  const deck = useMemo(() => cardsForAccess(hasVault), [hasVault]);
  const filtered = useMemo(
    () => deck.filter((card) => category === "all" || card.category === category),
    [deck, category],
  );

  const persist = useCallback(
    (entry: ProgressMap[string]) => {
      progressStore.upsert(entry);
      if (hasVault) {
        void apiFetch("/api/flashcards/progress", { method: "PUT", body: JSON.stringify({ entries: [entry] }) });
      }
    },
    [hasVault],
  );

  const overall = summarizeRetention(deck, progress);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="font-mono text-xs tracking-widest text-subtle uppercase">Overall</p>
          <p className="mt-2 text-3xl font-semibold">{overall.retention}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {overall.mastered} mastered · {overall.seen}/{overall.total} seen
          </p>
        </Card>
        {DOMAINS.map((domain) => {
          const summary = summarizeRetention(
            deck.filter((card) => card.domain === domain),
            progress,
          );
          return (
            <Card key={domain} className="p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{DOMAIN_LABELS[domain]}</p>
                <p className="font-mono text-lg font-semibold">{PMP_DOMAIN_WEIGHT[domain]}%</p>
              </div>
              <p className="font-mono text-[11px] text-subtle">of the PMP exam (2026 outline)</p>
              <Progress
                value={summary.retention}
                className="mt-4"
                tone={summary.retention >= 70 ? "success" : summary.retention >= 40 ? "brand" : "warning"}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {summary.retention}% retained · {summary.total} cards
              </p>
            </Card>
          );
        })}
      </div>

      {CATEGORY_GROUPS.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <p className="font-mono text-xs tracking-widest text-subtle uppercase">{group.label}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {group.categories.map((key) => {
              const summary = summarizeRetention(
                deck.filter((card) => card.category === key),
                progress,
              );
              const weight = CAPM_WEIGHT[key];
              return (
                <Card key={key} className="p-4">
                  <p className="text-sm font-medium">{CATEGORY_LABELS[key]}</p>
                  <p className="font-mono text-[11px] text-subtle">
                    {weight ? `${weight}% of CAPM` : key === "hybrid" ? "Heavily tested on PMP" : "PMP 2026"}
                  </p>
                  <Progress
                    value={summary.retention}
                    className="mt-3"
                    tone={summary.retention >= 70 ? "success" : summary.retention >= 40 ? "brand" : "warning"}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {summary.retention}% · {summary.total} cards
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {!hasVault ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brass/30 bg-brass/10 px-5 py-4">
          <p className="flex items-center gap-2 text-sm">
            <Lock className="size-4 text-brass" aria-hidden />
            Free sample: {deck.length} of {FLASHCARDS.length} cards. The full vault syncs retention to your account.
          </p>
          {session.owns("base_tool") ? (
            <Button
              variant="brass"
              size="sm"
              loading={purchase.pending === "exam_vault"}
              onClick={() => purchase.oneClick("exam_vault")}
              icon={<Zap className="size-4" aria-hidden />}
            >
              Unlock in 1 click · {formatUsd(PRODUCTS.exam_vault.priceCents)}
            </Button>
          ) : (
            <LinkButton href="/#pricing" variant="brass" size="sm">
              Unlock the Exam Vault
            </LinkButton>
          )}
        </div>
      ) : null}
      {purchase.error ? (
        <p className="text-sm text-destructive" role="alert">
          {purchase.error}
        </p>
      ) : null}

      <FilterGroup
        label="Category"
        value={category}
        options={[["all", "All"], ...CATEGORIES.map((key) => [key, CATEGORY_LABELS[key]] as const)]}
        onChange={(value) => setCategory(value as CategoryFilter)}
      />

      {/* The study queue depends on the current time and on-device progress, so it starts after hydration. */}
      {!isClient ? (
        <div
          className="mx-auto h-[420px] max-w-2xl animate-pulse rounded-2xl bg-surface-2"
          aria-label="Loading flashcards"
        />
      ) : (
        <StudySession
          key={`${category}-${hasVault}-${sessionNonce}`}
          cards={filtered}
          progress={progress}
          onReview={persist}
          onRestart={() => setSessionNonce((value) => value + 1)}
          onReset={() => {
            progressStore.reset();
            setSessionNonce((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="font-mono text-[11px] tracking-widest text-subtle uppercase">{label}</span>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === key ? "border-brand bg-brand/15 text-fg" : "border-border text-muted-foreground hover:text-fg",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function StudySession({
  cards,
  progress,
  onReview,
  onRestart,
  onReset,
}: {
  cards: readonly Flashcard[];
  progress: ProgressMap;
  onReview: (entry: ProgressMap[string]) => void;
  onRestart: () => void;
  onReset: () => void;
}) {
  // The queue is fixed when the session starts: due cards first, then new ones.
  const [queue, setQueue] = useState<Flashcard[]>(() => {
    const due = buildStudyQueue(cards, progress, new Date());
    return due.length > 0 ? due : [...cards];
  });
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, missed: 0 });
  const [exitDirection, setExitDirection] = useState<1 | -1>(1);

  const current = queue[0];

  const answer = useCallback(
    (wasCorrect: boolean) => {
      if (!current) return;
      onReview(reviewCard(progressStore.getSnapshot()[current.id], current.id, wasCorrect, new Date()));
      setExitDirection(wasCorrect ? 1 : -1);
      setStats((value) =>
        wasCorrect ? { ...value, correct: value.correct + 1 } : { ...value, missed: value.missed + 1 },
      );
      // Missed cards come back at the end of this session for another rep.
      setQueue((value) => (wasCorrect ? value.slice(1) : [...value.slice(1), value[0]]));
      setFlipped(false);
    },
    [current, onReview],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === " " || event.key === "Enter") {
        if (target?.tagName === "BUTTON") return;
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (event.key === "ArrowRight" && flipped) {
        answer(true);
      } else if (event.key === "ArrowLeft" && flipped) {
        answer(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, flipped]);

  if (cards.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        No cards match these filters in your current deck.
      </Card>
    );
  }

  if (!current) {
    const total = stats.correct + stats.missed;
    return (
      <Card className="mx-auto max-w-xl p-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
          <Trophy className="size-6" aria-hidden />
        </span>
        <h3 className="mt-4 text-xl font-semibold">Session complete</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {total} reviews · {total ? Math.round((stats.correct / total) * 100) : 0}% first-pass accuracy. Cards you
          missed are scheduled sooner; cards you knew move to longer intervals.
        </p>
        <Button className="mt-6" onClick={onRestart} icon={<RotateCcw className="size-4" aria-hidden />}>
          Study again
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">{queue.length} in queue</span>
        <span className="flex items-center gap-3">
          <span className="text-success">{stats.correct} known</span>
          <span className="text-danger">{stats.missed} missed</span>
        </span>
      </div>

      <div className="perspective-1200 relative h-[340px]">
        <AnimatePresence mode="popLayout" custom={exitDirection}>
          <SwipeCard
            key={`${current.id}-${stats.correct + stats.missed}`}
            card={current}
            flipped={flipped}
            onFlip={() => setFlipped((value) => !value)}
            onSwipe={answer}
            box={progressStore.getSnapshot()[current.id]?.box}
          />
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          disabled={!flipped}
          onClick={() => answer(false)}
          icon={<ThumbsDown className="size-4 text-danger" aria-hidden />}
        >
          Missed it
        </Button>
        <Button
          variant="secondary"
          onClick={() => setFlipped((value) => !value)}
          icon={<Shuffle className="size-4" aria-hidden />}
        >
          Flip
        </Button>
        <Button
          variant="secondary"
          disabled={!flipped}
          onClick={() => answer(true)}
          icon={<ThumbsUp className="size-4 text-success" aria-hidden />}
        >
          Got it
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <Keyboard className="size-3.5" aria-hidden /> Space to flip · ← missed · → got it · or swipe the card
        </span>
        <button type="button" onClick={onReset} className="underline-offset-2 hover:text-fg hover:underline">
          Reset progress
        </button>
      </div>
    </div>
  );
}

function SwipeCard({
  card,
  flipped,
  onFlip,
  onSwipe,
  box,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  onSwipe: (wasCorrect: boolean) => void;
  box: number | undefined;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-12, 12]);
  const knownOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const missedOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (!flipped) return;
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe(true);
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe(false);
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag={flipped ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      variants={CARD_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <motion.button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? "Show question" : "Show answer"}
        className="preserve-3d relative size-full rounded-2xl text-left"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 flex flex-col rounded-2xl border border-border-strong bg-surface p-7 shadow-xl backface-hidden">
          <div className="flex items-center gap-2">
            <Badge variant="brand">{CATEGORY_LABELS[card.category]}</Badge>
            {card.domain ? <Badge variant="neutral">PMP: {DOMAIN_LABELS[card.domain]}</Badge> : null}
            {box ? <span className="ml-auto font-mono text-[11px] text-subtle">Box {box}/5</span> : null}
          </div>
          <p className="my-auto text-xl leading-snug font-semibold text-balance sm:text-2xl">{card.front}</p>
          <p className="text-xs text-subtle">Tap or press space to reveal</p>
        </div>
        <div
          className="absolute inset-0 flex flex-col rounded-2xl border border-brand/40 bg-surface p-7 shadow-xl backface-hidden"
          style={{ transform: "rotateY(180deg)" }}
        >
          <p className="font-mono text-[11px] tracking-widest text-brand uppercase">Answer</p>
          <p className="mt-4 text-base leading-relaxed sm:text-lg">{card.back}</p>
          {card.fieldNote ? (
            <p className="mt-auto rounded-lg border border-brass/25 bg-brass/10 px-3 py-2 text-xs text-brass">
              Field note: {card.fieldNote}
            </p>
          ) : null}
        </div>
      </motion.button>
      <motion.span
        style={{ opacity: knownOpacity }}
        className="pointer-events-none absolute top-6 right-6 rounded-md border-2 border-success px-2 py-0.5 font-mono text-sm font-bold text-success uppercase"
      >
        Got it
      </motion.span>
      <motion.span
        style={{ opacity: missedOpacity }}
        className="pointer-events-none absolute top-6 left-6 rounded-md border-2 border-danger px-2 py-0.5 font-mono text-sm font-bold text-danger uppercase"
      >
        Missed
      </motion.span>
    </motion.div>
  );
}
