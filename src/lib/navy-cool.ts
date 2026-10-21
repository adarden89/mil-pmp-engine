import { NAVY_COOL } from "./pmi-facts";

/**
 * Navy COOL timing rules from the OPNAV 1500/57 (Rev. 01 May 2026):
 * - Enlisted: EAOS must be more than 2 months after Navy COOL receives the form.
 * - Credentialing activity must be finished at least 60 days before separation
 *   (waivable down to 30 days).
 * Dates are month precision (YYYY-MM), so the checks are deliberately conservative.
 */

export interface TimingIssue {
  severity: "blocker" | "warning";
  message: string;
}

/** Days we assume command routing takes before Navy COOL receives the form. */
export const ASSUMED_ROUTING_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfMonth(value: string): Date | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)) : null;
}

function endOfMonth(value: string): Date | null {
  const start = startOfMonth(value);
  return start ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)) : null;
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

export function checkNavyCoolTiming(
  obligatedServiceEnd: string | undefined,
  targetExamMonth: string | undefined,
  today: Date = new Date(),
): TimingIssue[] {
  const issues: TimingIssue[] = [];
  // Earliest day of the EAOS month: if that works, any day in the month works.
  const eaos = obligatedServiceEnd ? startOfMonth(obligatedServiceEnd) : null;
  if (!eaos) {
    issues.push({ severity: "warning", message: "Add your EAOS / end of obligated service so timing can be checked." });
    return issues;
  }

  const receipt = new Date(today.getTime() + ASSUMED_ROUTING_DAYS * DAY_MS);
  if (eaos.getTime() <= addMonths(receipt, NAVY_COOL.minMonthsRemainingAtReceipt).getTime()) {
    issues.push({
      severity: "blocker",
      message: `Your EAOS must be more than ${NAVY_COOL.minMonthsRemainingAtReceipt} months after Navy COOL receives the form. Allowing about ${ASSUMED_ROUTING_DAYS} days for command routing, your EAOS is too close.`,
    });
  }

  const exam = targetExamMonth ? endOfMonth(targetExamMonth) : null;
  if (exam) {
    const lastAllowed = new Date(eaos.getTime() - NAVY_COOL.finishBeforeSeparationDays * DAY_MS);
    if (exam.getTime() > lastAllowed.getTime()) {
      issues.push({
        severity: "blocker",
        message: `The exam must be completed at least ${NAVY_COOL.finishBeforeSeparationDays} days before separation (waivers down to 30 days exist). Move your target exam month earlier.`,
      });
    }
    if (exam.getTime() < receipt.getTime()) {
      issues.push({
        severity: "warning",
        message:
          "Your target exam month is before funding could realistically be approved. Do not schedule until approval arrives.",
      });
    }
  }
  return issues;
}
