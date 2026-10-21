"use client";

import { Download, FileDown, Lock, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSession } from "@/components/providers/session-provider";
import { usePurchase } from "@/components/providers/use-purchase";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge, Card, Field, inputClasses } from "@/components/ui/primitives";
import { COOL_DOCUMENT_IDS, COOL_DOCUMENT_META, type CoolDocumentId } from "@/lib/documents/cool-documents-meta";
import type { FundingProgramId } from "@/lib/funding-data";
import { FUNDING_PROGRAMS } from "@/lib/funding-data";
import { PRODUCTS } from "@/lib/catalog";
import { formatUsd } from "@/lib/utils";
import { loginHref } from "@/lib/api-client";

interface PacketForm {
  fullName: string;
  rank: string;
  rateOrMos: string;
  command: string;
  credential: "CAPM" | "PMP";
  obligatedServiceEnd: string;
  targetExamMonth: string;
}

const EMPTY_FORM: PacketForm = {
  fullName: "",
  rank: "",
  rateOrMos: "",
  command: "",
  credential: "CAPM",
  obligatedServiceEnd: "",
  targetExamMonth: "",
};

export function DocumentDownloads({ branch }: { branch: FundingProgramId }) {
  const session = useSession();
  const purchase = usePurchase();
  const [form, setForm] = useState<PacketForm>(EMPTY_FORM);
  const [busy, setBusy] = useState<CoolDocumentId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unlocked = session.owns("cool_fast_track");

  function update<K extends keyof PacketForm>(key: K, value: PacketForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function download(doc: CoolDocumentId, event?: FormEvent) {
    event?.preventDefault();
    setBusy(doc);
    setError(null);
    const params = new URLSearchParams({ branch });
    for (const [key, value] of Object.entries(form)) {
      if (value) params.set(key, value);
    }
    try {
      const response = await fetch(`/api/downloads/${doc}?${params.toString()}`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(body?.error?.message ?? "Download failed. Please try again.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
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

  const fastTrack = PRODUCTS.cool_fast_track;

  return (
    <section id="downloads" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-brand uppercase">COOL Voucher Fast-Track</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Your pre-filled voucher packet</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Enter your details once. Both PDFs are generated for {FUNDING_PROGRAMS[branch].shortName} with your
            information filled in. They are planning aids; official requests go through your service&apos;s portal.
          </p>
        </div>
        {unlocked ? (
          <Badge tone="success">Unlocked</Badge>
        ) : (
          <Badge tone="brass">{formatUsd(fastTrack.priceCents)} add-on</Badge>
        )}
      </div>

      <div className="relative mt-8">
        <Card className={unlocked ? "p-6 sm:p-8" : "p-6 opacity-40 blur-[2px] select-none sm:p-8"} inert={!unlocked}>
          <form
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={(event) => download("voucher-prep-worksheet", event)}
          >
            <Field label="Full name" htmlFor="fullName">
              <input
                id="fullName"
                className={inputClasses}
                value={form.fullName}
                maxLength={80}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Jordan Rivera"
              />
            </Field>
            <Field label="Rank" htmlFor="rank">
              <input
                id="rank"
                className={inputClasses}
                value={form.rank}
                maxLength={24}
                onChange={(e) => update("rank", e.target.value)}
                placeholder="IT2"
              />
            </Field>
            <Field label="Rate / MOS / AFSC" htmlFor="rateOrMos">
              <input
                id="rateOrMos"
                className={inputClasses}
                value={form.rateOrMos}
                maxLength={80}
                onChange={(e) => update("rateOrMos", e.target.value)}
                placeholder="Information Systems Technician"
              />
            </Field>
            <Field label="Command / unit" htmlFor="command">
              <input
                id="command"
                className={inputClasses}
                value={form.command}
                maxLength={120}
                onChange={(e) => update("command", e.target.value)}
                placeholder="USS Example (DDG 00)"
              />
            </Field>
            <Field label="Credential" htmlFor="credential">
              <select
                id="credential"
                className={inputClasses}
                value={form.credential}
                onChange={(e) => update("credential", e.target.value as PacketForm["credential"])}
              >
                <option value="CAPM">CAPM</option>
                <option value="PMP">PMP</option>
              </select>
            </Field>
            <Field label="Obligated service ends" htmlFor="obligatedServiceEnd" hint="YYYY-MM">
              <input
                id="obligatedServiceEnd"
                type="month"
                className={inputClasses}
                value={form.obligatedServiceEnd}
                onChange={(e) => update("obligatedServiceEnd", e.target.value)}
              />
            </Field>
            <Field label="Target exam month" htmlFor="targetExamMonth" hint="YYYY-MM">
              <input
                id="targetExamMonth"
                type="month"
                className={inputClasses}
                value={form.targetExamMonth}
                onChange={(e) => update("targetExamMonth", e.target.value)}
              />
            </Field>
          </form>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {COOL_DOCUMENT_IDS.map((doc) => (
              <div key={doc} className="flex items-start gap-4 rounded-xl border border-border bg-bg-elevated/60 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <FileDown className="size-5" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{COOL_DOCUMENT_META[doc].title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{COOL_DOCUMENT_META[doc].description}</p>
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
          {error ? (
            <p className="mt-4 text-sm text-danger" role="alert">
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
              <h3 className="mt-4 text-lg font-semibold">Unlock your pre-filled packet</h3>
              <p className="mt-2 text-sm text-muted">{fastTrack.headline}</p>
              <div className="mt-5 flex flex-col gap-2">
                {session.owns("base_tool") ? (
                  <Button
                    variant="brass"
                    loading={purchase.pending === "cool_fast_track"}
                    onClick={() => purchase.oneClick("cool_fast_track")}
                    icon={<Zap className="size-4" aria-hidden />}
                  >
                    Unlock in 1 click · {formatUsd(fastTrack.priceCents)}
                  </Button>
                ) : (
                  <LinkButton href="/#pricing" variant="brass">
                    Get Base Tool + Fast-Track
                  </LinkButton>
                )}
                {!session.signedIn && session.status === "ready" ? (
                  <LinkButton href={loginHref("/funding#downloads")} variant="ghost" size="sm">
                    Already purchased? Sign in
                  </LinkButton>
                ) : null}
              </div>
              {purchase.error ? (
                <p className="mt-3 text-sm text-danger" role="alert">
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
