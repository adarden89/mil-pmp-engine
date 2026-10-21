"use client";

import { motion } from "framer-motion";
import { Check, CircleAlert, Lock, ShieldCheck, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePurchase } from "@/components/providers/use-purchase";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ADDON_IDS, cartTotalCents, PRODUCTS, type ProductId } from "@/lib/catalog";
import { EXAM_FEES, FACTS_AS_OF } from "@/lib/pmi-facts";
import { trackFunnelEvent } from "@/lib/tracking/browser";
import { cn, formatUsd } from "@/lib/utils";

function CancelledNotice() {
  const params = useSearchParams();
  if (params.get("checkout") !== "cancelled") return null;
  return (
    <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
      <CircleAlert className="size-4" aria-hidden /> Checkout was cancelled. You were not charged.
    </p>
  );
}

export function PricingTiers() {
  const session = useSession();
  const purchase = usePurchase();
  const [bumps, setBumps] = useState<ProductId[]>([]);
  const ownsBase = session.owns("base_tool");
  const base = PRODUCTS.base_tool;

  const sectionRef = useRef<HTMLElement>(null);

  // One ViewContent per visit when the pricing section is actually seen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackFunnelEvent("ViewContent", ["base_tool"]);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cart: ProductId[] = ["base_tool", ...bumps];
  const total = cartTotalCents(cart);

  function toggleBump(id: ProductId) {
    setBumps((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section ref={sectionRef} id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Pricing"
        title="Priced for an E-3's paycheck"
        description="One-time payments, no subscription. Add-ons unlock in a single click after your first purchase."
      />
      <Suspense fallback={null}>
        <CancelledNotice />
      </Suspense>
      <ExamFeeAnchor />

      <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="border-gradient relative h-full rounded-2xl p-8 shadow-[0_30px_80px_-30px_var(--glow)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="brand">Core platform</Badge>
                <h3 className="mt-4 text-2xl font-semibold">{base.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{base.headline}</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-semibold tracking-tight">{formatUsd(base.priceCents)}</p>
                <p className="mt-1 text-xs text-subtle">one-time</p>
              </div>
            </div>
            <ul className="mt-8 space-y-3">
              {base.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            {ownsBase ? (
              <div className="mt-8 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                <ShieldCheck className="size-4" aria-hidden /> You own the Core Translator. Add-ons below are one click.
              </div>
            ) : (
              <>
                <fieldset className="mt-8 space-y-2">
                  <legend className="mb-3 font-mono text-xs tracking-widest text-subtle uppercase">
                    Add to this order
                  </legend>
                  {ADDON_IDS.map((id) => {
                    const product = PRODUCTS[id];
                    const checked = bumps.includes(id);
                    return (
                      <label
                        key={id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                          checked ? "border-brand bg-brand/10" : "border-border hover:border-border-strong",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--brand)]"
                          checked={checked}
                          onChange={() => toggleBump(id)}
                        />
                        <span className="flex-1 text-sm">
                          <span className="font-medium">{product.name}</span>
                          <span className="block text-xs text-muted-foreground">{product.headline}</span>
                        </span>
                        <span className="font-mono text-sm font-medium">+{formatUsd(product.priceCents)}</span>
                      </label>
                    );
                  })}
                </fieldset>
                <Button
                  size="lg"
                  className="mt-6 w-full"
                  loading={purchase.pending === "cart"}
                  onClick={() => purchase.checkout(cart)}
                  icon={<Lock className="size-4" aria-hidden />}
                >
                  Secure checkout · {formatUsd(total)}
                </Button>
              </>
            )}
            {purchase.error ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {purchase.error}
              </p>
            ) : null}
            <p className="mt-4 text-xs leading-relaxed text-subtle">
              Payments by Stripe. Your card is saved by Stripe with your consent so add-ons are one click later. These
              prices are for this software only. Exam fees are paid to PMI, typically by your COOL or CA program.
            </p>
          </div>
        </motion.div>

        <div className="grid gap-6">
          {ADDON_IDS.map((id, index) => (
            <AddonCard key={id} id={id} delay={0.1 * (index + 1)} purchase={purchase} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AddonCard({
  id,
  delay,
  purchase,
}: {
  id: ProductId;
  delay: number;
  purchase: ReturnType<typeof usePurchase>;
}) {
  const session = useSession();
  const product = PRODUCTS[id];
  const owned = session.owns(id);
  const canOneClick = session.owns("base_tool") && !owned;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="h-full p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="brass">Add-on</Badge>
            <h3 className="mt-3 text-lg font-semibold">{product.name}</h3>
          </div>
          <p className="text-3xl font-semibold tracking-tight">{formatUsd(product.priceCents)}</p>
        </div>
        <ul className="mt-5 space-y-2">
          {product.features.map((feature) => (
            <li key={feature} className="flex gap-2.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          {owned ? (
            <Badge variant="success">
              <ShieldCheck className="size-3" aria-hidden /> Unlocked
            </Badge>
          ) : canOneClick ? (
            <Button
              variant="brass"
              className="w-full"
              loading={purchase.pending === id}
              onClick={() => purchase.oneClick(id)}
              icon={<Zap className="size-4" aria-hidden />}
            >
              Unlock in 1 click · {formatUsd(product.priceCents)}
            </Button>
          ) : (
            <p className="text-xs text-subtle">
              Add it to your Core Translator order, or unlock it in one click afterwards.
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Price anchor built on real numbers: the exam fee approved COOL/CA funding pays,
 * next to what the member actually pays us. No fictitious "was" price.
 */
function ExamFeeAnchor() {
  return (
    <div className="mx-auto mt-10 grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
      <div className="bg-card p-5">
        <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">CAPM exam fee</p>
        <p className="mt-2 text-2xl font-semibold">
          ${EXAM_FEES.CAPM.member}–${EXAM_FEES.CAPM.nonMember}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Paid by approved COOL / CA funding, not you</p>
      </div>
      <div className="bg-card p-5">
        <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">PMP exam fee</p>
        <p className="mt-2 text-2xl font-semibold">
          ${EXAM_FEES.PMP.member}–${EXAM_FEES.PMP.nonMember}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Paid by approved COOL / CA funding, not you</p>
      </div>
      <div className="bg-card p-5">
        <p className="font-mono text-[11px] tracking-widest text-brand uppercase">MilToPMP Core</p>
        <p className="mt-2 text-2xl font-semibold">{formatUsd(PRODUCTS.base_tool.priceCents)}</p>
        <p className="mt-1 text-xs text-muted-foreground">One-time. Helps you get that funding approved.</p>
      </div>
      <p className="bg-card px-5 py-2 text-[11px] text-subtle sm:col-span-3">
        PMI fee ranges are member to non-member pricing as of {FACTS_AS_OF}. Confirm current fees at pmi.org.
      </p>
    </div>
  );
}
