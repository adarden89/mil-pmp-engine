"use client";

import { motion } from "framer-motion";
import { CircleCheck, LoaderCircle, MailCheck, OctagonAlert, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CheckoutVerifyResponse } from "@/app/api/checkout/verify/route";
import { useSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { PRODUCTS } from "@/lib/catalog";
import { trackPurchase } from "@/lib/tracking/browser";

const MAX_ATTEMPTS = 10;
const RETRY_MS = 2000;
const REDIRECT_DELAY_MS = 2200;

type Phase =
  | { kind: "verifying" }
  | { kind: "unlocked"; data: CheckoutVerifyResponse }
  | { kind: "delayed" }
  | { kind: "error"; message: string };

/**
 * Confirms payment (the server fulfills idempotently), then either drops a
 * signed-in buyer into the dashboard or tells a guest buyer where their
 * sign-in link went.
 */
export function CheckoutSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useSession();
  const sessionId = params.get("session_id");
  const tracked = useRef(false);
  const [phase, setPhase] = useState<Phase>(
    sessionId ? { kind: "verifying" } : { kind: "error", message: "Missing checkout reference." },
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function attempt(count: number) {
      const result = await apiFetch<CheckoutVerifyResponse>(
        `/api/checkout/verify?session_id=${encodeURIComponent(sessionId!)}`,
      );
      if (cancelled) return;
      if (result.ok && result.data.status === "fulfilled") {
        const data = result.data;
        if (!tracked.current) {
          tracked.current = true;
          trackPurchase(sessionId!, data.amountTotal, data.currency, data.productIds);
        }
        setPhase({ kind: "unlocked", data });
        if (!data.guest) {
          await refresh();
          timer = setTimeout(() => router.replace(data.redirectTo), REDIRECT_DELAY_MS);
        }
        return;
      }
      if (!result.ok && result.status !== 0 && result.status < 500) {
        setPhase({ kind: "error", message: result.message });
        return;
      }
      if (count + 1 >= MAX_ATTEMPTS) {
        setPhase({ kind: "delayed" });
        return;
      }
      timer = setTimeout(() => void attempt(count + 1), RETRY_MS);
    }

    void attempt(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, refresh, router]);

  if (phase.kind === "unlocked") {
    return phase.data.guest ? (
      <GuestAccess data={phase.data} sessionId={sessionId!} />
    ) : (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/15 text-success"
        >
          <ShieldCheck className="size-7" aria-hidden />
        </motion.span>
        <h1 className="mt-5 text-2xl font-semibold">Payment confirmed</h1>
        <PurchasedList data={phase.data} />
        <p className="mt-6 text-sm text-muted-foreground">Taking you to your dashboard…</p>
      </Card>
    );
  }

  if (phase.kind === "verifying") {
    return (
      <Card className="mx-auto flex max-w-lg flex-col items-center p-10 text-center">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold">Confirming your payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <h1 className="text-xl font-semibold">
        {phase.kind === "delayed" ? "Your payment is still processing" : "We couldn't confirm this checkout"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {phase.kind === "delayed"
          ? "Stripe has your payment. Access unlocks automatically as soon as it clears, and we email your sign-in link."
          : phase.message}
      </p>
      <LinkButton href="/login" className="mt-6">
        Go to sign in
      </LinkButton>
    </Card>
  );
}

function PurchasedList({ data }: { data: CheckoutVerifyResponse }) {
  return (
    <ul className="mt-5 space-y-2 text-left">
      {data.productIds.map((id) => (
        <motion.li
          key={id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <CircleCheck className="size-4 text-success" aria-hidden />
          {PRODUCTS[id].name}
        </motion.li>
      ))}
    </ul>
  );
}

function GuestAccess({ data, sessionId }: { data: CheckoutVerifyResponse; sessionId: string }) {
  const [resend, setResend] = useState<{ state: "idle" | "sending" | "sent" | "error"; message?: string }>({
    state: "idle",
  });

  async function resendLink() {
    setResend({ state: "sending" });
    const result = await apiFetch<{ sent: boolean }>("/api/checkout/resend-access", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
    setResend(result.ok ? { state: "sent" } : { state: "error", message: result.message });
  }

  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/15 text-success"
      >
        <MailCheck className="size-7" aria-hidden />
      </motion.span>
      <h1 className="mt-5 text-2xl font-semibold">You&apos;re in. Check your inbox.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account is set up. We emailed a secure sign-in link to{" "}
        <span className="font-medium text-foreground">{data.emailHint ?? "the email you used at checkout"}</span>. No
        password needed.
      </p>
      <PurchasedList data={data} />
      <Alert variant="critical" className="mt-6 text-left">
        <OctagonAlert aria-hidden />
        <AlertDescription className="text-foreground">
          Do not pay out of pocket or schedule your exam before your COOL / IgnitED voucher is approved.
        </AlertDescription>
      </Alert>
      <div className="mt-6 flex flex-col items-center gap-2">
        <Button
          variant="secondary"
          loading={resend.state === "sending"}
          disabled={resend.state === "sent"}
          onClick={resendLink}
        >
          {resend.state === "sent" ? "New link sent" : "Resend my sign-in link"}
        </Button>
        {resend.state === "error" ? <p className="text-xs text-destructive">{resend.message}</p> : null}
        <p className="text-xs text-subtle">
          Using a .mil address? Check your junk folder; government filters can delay it.
        </p>
      </div>
    </Card>
  );
}
