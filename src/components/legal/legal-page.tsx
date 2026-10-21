import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

/** Shared shell for policy pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
      <Alert variant="warning" className="mt-8">
        <TriangleAlert aria-hidden />
        <AlertDescription className="text-foreground">
          Template text written for this codebase. Have qualified counsel review it, fill in your business details, and
          confirm it matches your actual data practices before you launch or run ads.
        </AlertDescription>
      </Alert>
      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}
