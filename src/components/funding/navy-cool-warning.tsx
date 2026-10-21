"use client";

import { OctagonAlert } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox, Label } from "@/components/ui/form-controls";

export const COOL_WARNING_TEXT =
  "CRITICAL: Do NOT pay out of pocket or schedule your exam before receiving your official Navy COOL / Army IgnitED voucher!";

/** Bump when the warning text changes so every member acknowledges it again. */
const ACK_KEY = "miltopmp:cool-warning-ack:v1";
const listeners = new Set<() => void>();

const ackStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get(): boolean {
    try {
      return localStorage.getItem(ACK_KEY) === "yes";
    } catch {
      return false;
    }
  },
  set(): void {
    try {
      localStorage.setItem(ACK_KEY, "yes");
    } catch {
      // Storage blocked: the member re-acknowledges on the next visit.
    }
    for (const listener of listeners) listener();
  },
};

/** Persistent, non-dismissable banner. */
export function NavyCoolWarningBanner({ compact = false }: { compact?: boolean }) {
  return (
    <Alert variant="critical">
      <OctagonAlert aria-hidden />
      <AlertTitle className="text-base">{COOL_WARNING_TEXT}</AlertTitle>
      {compact ? null : (
        <AlertDescription className="text-foreground/85">
          <p>
            Unapproved out-of-pocket expenses are not reimbursed. Submit your PMI application first (it is free), get
            your funding request approved, and only then schedule the exam with the voucher or funded authorization.
          </p>
        </AlertDescription>
      )}
    </Alert>
  );
}

/**
 * Unskippable gate: shows the banner always, and blocks the funding tools with
 * a dialog until the member ticks the acknowledgement. Escape and outside
 * clicks cannot close it.
 */
export function NavyCoolWarningGate({ children }: { children: React.ReactNode }) {
  const acknowledged = useSyncExternalStore(ackStore.subscribe, ackStore.get, () => true);
  const [checked, setChecked] = useState(false);

  return (
    <>
      <NavyCoolWarningBanner />
      <AlertDialog open={!acknowledged}>
        <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()} className="border-2 border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <OctagonAlert className="size-5" aria-hidden /> Read before you continue
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-semibold text-foreground">
              {COOL_WARNING_TEXT}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>COOL and credentialing programs do not reimburse fees you pay yourself.</li>
            <li>Registering or paying for the exam before approval can cost you the full fee.</li>
            <li>The PMI application itself is free. Submit it first, then request funding.</li>
          </ul>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/60 p-3">
            <Checkbox id="cool-ack" checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
            <Label htmlFor="cool-ack" className="leading-snug">
              I understand. I will not pay or schedule the exam until my voucher is approved.
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction disabled={!checked} onClick={() => ackStore.set()}>
              I understand, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div inert={!acknowledged} aria-hidden={!acknowledged}>
        {children}
      </div>
    </>
  );
}
