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
import { FUNDING_WARNING } from "@/lib/funding-data";

export const COOL_WARNING_TEXT = FUNDING_WARNING;

/** Bump when the warning text changes so every member acknowledges it again. */
const ACK_KEY = "miltopmp:cool-warning-ack:v2";
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
            Submit your PMI application first (it is free), get your funding request approved, and only then schedule
            the exam. Navy, Marine Corps, Army, and Air Force programs pay the fee for you. Coast Guard Credentialing
            Assistance reimburses you, but only for fees paid after ETQC issues your CA Authorization.
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
            <li>No COOL or credentialing program reimburses fees you pay before approval.</li>
            <li>Registering or paying for the exam before approval can cost you the full fee.</li>
            <li>Coast Guard: you pay, then claim it back, only after your CA Authorization is issued.</li>
            <li>The PMI application itself is free. Submit it first, then request funding.</li>
          </ul>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/60 p-3">
            <Checkbox id="cool-ack" checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
            <Label htmlFor="cool-ack" className="leading-snug">
              I understand. I will not pay or schedule the exam until my voucher or funding authorization is approved.
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
