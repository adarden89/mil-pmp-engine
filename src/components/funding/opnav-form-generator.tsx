"use client";

import { CircleCheck, Download, ExternalLink, FileDown, Lock, OctagonAlert, TriangleAlert, Zap } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { usePurchase } from "@/components/providers/use-purchase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { Field } from "@/components/ui/primitives";
import { loginHref } from "@/lib/api-client";
import { PRODUCTS } from "@/lib/catalog";
import { COOL_DOCUMENT_IDS, COOL_DOCUMENT_META, type CoolDocumentId } from "@/lib/documents/cool-documents-meta";
import { FUNDING_PROGRAMS, type FundingProgramId } from "@/lib/funding-data";
import { checkNavyCoolTiming, type TimingIssue } from "@/lib/navy-cool";
import { NAVY_COOL } from "@/lib/pmi-facts";
import { formatUsd } from "@/lib/utils";

interface PacketForm {
  credential: "CAPM" | "PMP";
  fullName: string;
  rank: string;
  rateOrMos: string;
  command: string;
  uic: string;
  email: string;
  phone: string;
  obligatedServiceEnd: string;
  targetExamMonth: string;
  mappingBasis: string;
  pmiApplicationId: string;
  pmiMember: boolean;
  approverName: string;
  approverTitle: string;
  approverEmail: string;
}

const EMPTY_FORM: PacketForm = {
  credential: "CAPM",
  fullName: "",
  rank: "",
  rateOrMos: "",
  command: "",
  uic: "",
  email: "",
  phone: "",
  obligatedServiceEnd: "",
  targetExamMonth: "",
  mappingBasis: "",
  pmiApplicationId: "",
  pmiMember: false,
  approverName: "",
  approverTitle: "",
  approverEmail: "",
};

/**
 * Fast-Track packet builder. For Navy members it prepares everything the
 * OPNAV 1500/57 asks for; for other services, the JST checklist and voucher
 * worksheet. Documents are generated server-side behind the entitlement.
 */
export function OpnavFormGenerator({ branch }: { branch: FundingProgramId }) {
  const session = useSession();
  const purchase = usePurchase();
  const [form, setForm] = useState<PacketForm>(EMPTY_FORM);
  const [timing, setTiming] = useState<TimingIssue[] | null>(null);
  const [busy, setBusy] = useState<CoolDocumentId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unlocked = session.owns("cool_fast_track");
  const isNavy = branch === "navy";
  const documents = COOL_DOCUMENT_IDS.filter((id) => isNavy || !COOL_DOCUMENT_META[id].navyOnly);

  function update<K extends keyof PacketForm>(key: K, value: PacketForm[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (key === "obligatedServiceEnd" || key === "targetExamMonth") {
      // Timing depends on today's date, so it is computed here, in the event, not during render.
      setTiming(next.obligatedServiceEnd ? checkNavyCoolTiming(next.obligatedServiceEnd, next.targetExamMonth) : null);
    }
  }

  async function download(doc: CoolDocumentId) {
    setBusy(doc);
    setError(null);
    try {
      const body = Object.fromEntries(
        Object.entries({ ...form, branch }).filter(([, value]) => value !== "" && value !== undefined),
      );
      const response = await fetch(`/api/downloads/${doc}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(payload?.error?.message ?? "Download failed. Please try again.");
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = COOL_DOCUMENT_META[doc].filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  const guide = PRODUCTS.cool_fast_track;
  const input = (key: keyof PacketForm, label: string, props: Record<string, unknown> = {}, hint?: string) => (
    <Field label={label} htmlFor={`pkt-${key}`} hint={hint}>
      <Input
        id={`pkt-${key}`}
        value={form[key] as string}
        onChange={(event) => update(key, event.target.value as never)}
        {...props}
      />
    </Field>
  );

  return (
    <section id="opnav-1500-57" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-primary uppercase">Navy COOL Fast-Track Guide</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {isNavy ? `${NAVY_COOL.formNumber} prep packet` : "Your pre-filled funding packet"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {isNavy
              ? `Answer once and get every field the ${NAVY_COOL.formNumber} "${NAVY_COOL.formTitle}" (Rev. ${NAVY_COOL.formRevision}) asks for, a timing check against Navy COOL's rules, and a routing memo for your approving official. You transfer it onto the official form from Navy COOL; the packet is not a substitute for it.`
              : `Answer once and get a JST audit checklist and a funding worksheet for ${FUNDING_PROGRAMS[branch].shortName}, with your details filled in.`}
          </p>
        </div>
        {unlocked ? (
          <Badge variant="success">
            <CircleCheck aria-hidden /> Unlocked
          </Badge>
        ) : (
          <Badge variant="brass">{formatUsd(guide.priceCents)} add-on</Badge>
        )}
      </div>

      <div className="relative mt-8">
        <Card className={unlocked ? "p-6 sm:p-8" : "p-6 opacity-40 blur-[2px] select-none sm:p-8"} inert={!unlocked}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {input("fullName", "Full name", { maxLength: 80, autoComplete: "name" })}
            {input("rank", "Rank / rate", { maxLength: 24, placeholder: "IT2" })}
            {input("rateOrMos", "Rating / MOS / AFSC", { maxLength: 80 })}
            {input("command", "Command / unit", { maxLength: 120 })}
            {isNavy ? input("uic", "UIC", { maxLength: 12 }) : null}
            {input("email", "Email", { type: "email", maxLength: 120, autoComplete: "email" })}
            {input("phone", "Phone", { type: "tel", maxLength: 32 })}
            <Field label="Credential" htmlFor="pkt-credential">
              <NativeSelect
                id="pkt-credential"
                value={form.credential}
                onChange={(event) => update("credential", event.target.value as PacketForm["credential"])}
              >
                <option value="CAPM">CAPM</option>
                <option value="PMP">PMP</option>
              </NativeSelect>
            </Field>
            {input("obligatedServiceEnd", "EAOS / end of obligation", { type: "month" }, "YYYY-MM")}
            {input("targetExamMonth", "Target exam month", { type: "month" }, "Only after approval")}
            {input("pmiApplicationId", "PMI application ID", { maxLength: 40 }, "After you submit to PMI")}
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pkt-pmiMember"
                  checked={form.pmiMember}
                  onCheckedChange={(value) => update("pmiMember", value === true)}
                />
                <Label htmlFor="pkt-pmiMember">I am a PMI member</Label>
              </div>
            </div>
          </div>

          {isNavy ? (
            <div className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-4">
                {input(
                  "mappingBasis",
                  "How the credential is mapped to you",
                  { maxLength: 120, placeholder: "e.g. IT rating, or collateral duty as project coordinator" },
                  "Copy this from the Navy COOL page you screenshotted.",
                )}
              </div>
              {input("approverName", "Approving official", { maxLength: 80 })}
              {input("approverTitle", "Approver title", { maxLength: 80, placeholder: "Commanding Officer" })}
              {input("approverEmail", "Approver email", { type: "email", maxLength: 120 })}
            </div>
          ) : null}

          {isNavy && timing ? (
            <div className="mt-6 space-y-2">
              {timing.length === 0 ? (
                <Alert variant="success">
                  <CircleCheck aria-hidden />
                  <AlertDescription className="text-foreground">
                    Timing fits Navy COOL&apos;s rules: EAOS more than {NAVY_COOL.minMonthsRemainingAtReceipt} months
                    after receipt, exam at least {NAVY_COOL.finishBeforeSeparationDays} days before separation.
                  </AlertDescription>
                </Alert>
              ) : (
                timing.map((issue) => (
                  <Alert key={issue.message} variant={issue.severity === "blocker" ? "critical" : "warning"}>
                    {issue.severity === "blocker" ? <OctagonAlert aria-hidden /> : <TriangleAlert aria-hidden />}
                    <AlertDescription className="text-foreground">{issue.message}</AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          ) : null}

          <p className="mt-6 text-xs text-subtle">
            We never ask for your SSN or DoD ID. Write those directly on the official form. Details you enter here are
            used only to generate your PDFs and are not stored.
          </p>

          <div className={`mt-6 grid gap-4 ${documents.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
            {documents.map((doc) => (
              <div key={doc} className="flex items-start gap-4 rounded-xl border border-border bg-bg-elevated/60 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileDown className="size-5" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{COOL_DOCUMENT_META[doc].title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {COOL_DOCUMENT_META[doc].description}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-4"
                    loading={busy === doc}
                    onClick={() => download(doc)}
                    icon={<Download className="size-4" aria-hidden />}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {isNavy ? (
            <a
              href={NAVY_COOL.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Get the official {NAVY_COOL.formNumber} from Navy COOL <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </Card>

        {!unlocked ? (
          <div className="absolute inset-0 grid place-items-center p-4">
            <Card className="max-w-md p-6 text-center shadow-2xl">
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brass/15 text-brass">
                <Lock className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">Unlock the Fast-Track Guide</h3>
              <p className="mt-2 text-sm text-muted-foreground">{guide.headline}</p>
              <div className="mt-5 flex flex-col gap-2">
                {session.owns("base_tool") ? (
                  <Button
                    variant="brass"
                    loading={purchase.pending === "cool_fast_track"}
                    onClick={() => purchase.oneClick("cool_fast_track")}
                    icon={<Zap className="size-4" aria-hidden />}
                  >
                    Unlock in 1 click · {formatUsd(guide.priceCents)}
                  </Button>
                ) : (
                  <LinkButton href="/#pricing" variant="brass">
                    Get Core Translator + Fast-Track
                  </LinkButton>
                )}
                {!session.signedIn && session.status === "ready" ? (
                  <LinkButton href={loginHref("/funding#opnav-1500-57")} variant="ghost" size="sm">
                    Already purchased? Sign in
                  </LinkButton>
                ) : null}
              </div>
              {purchase.error ? (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {purchase.error}
                </p>
              ) : null}
            </Card>
          </div>
        ) : null}
      </div>
    </section>
  );
}
