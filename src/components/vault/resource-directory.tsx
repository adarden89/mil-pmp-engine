"use client";

import { CircleAlert, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { RESOURCE_CATEGORY_LABELS, RESOURCES, type ResourceCategory } from "@/lib/resources";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategory[];

export function ResourceDirectory() {
  const [category, setCategory] = useState<ResourceCategory | "all">("all");
  const visible = RESOURCES.filter((resource) => category === "all" || resource.category === category);

  return (
    <section>
      <SectionHeading
        align="left"
        eyebrow="Resource directory"
        title="The study stack, broken down"
        description="What each tool is actually good for, what it costs, and where to be careful. No affiliate links."
      />
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Category">
        {(["all", ...CATEGORIES] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            aria-pressed={category === key}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === key ? "border-brand bg-brand/15 text-fg" : "border-border text-muted hover:text-fg",
            )}
          >
            {key === "all" ? "All" : RESOURCE_CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((resource) => (
          <Card key={resource.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="neutral">{RESOURCE_CATEGORY_LABELS[resource.category]}</Badge>
                <h3 className="mt-3 text-base font-semibold">{resource.name}</h3>
                <p className="text-xs text-subtle">{resource.provider}</p>
              </div>
              <span className="shrink-0 text-right font-mono text-[11px] text-muted">{resource.cost}</span>
            </div>
            <p className="mt-4 text-sm">
              <span className="text-subtle">Best for: </span>
              {resource.bestFor}
            </p>
            <ul className="mt-3 flex-1 space-y-1.5">
              {resource.breakdown.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-muted">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            {resource.caution ? (
              <p className="mt-4 flex gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {resource.caution}
              </p>
            ) : null}
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              Open {resource.provider} <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Card>
        ))}
      </div>
    </section>
  );
}
