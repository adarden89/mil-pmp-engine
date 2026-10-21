import Link from "next/link";
import { cn } from "@/lib/utils";

/** Chevron-and-arrow mark: a rank insignia that becomes a forward path. */
export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="MilToPMP Enterprise home"
    >
      <span className="relative grid size-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-brand to-brand-2 shadow-[0_6px_20px_-6px_var(--glow)]">
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" aria-hidden>
          <path
            d="M5 15l7-5 7 5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 19l7-5 7 5"
            stroke="currentColor"
            strokeOpacity=".55"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="5.5" r="1.8" fill="currentColor" />
        </svg>
      </span>
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">MilToPMP</span>
          <span className="mt-0.5 font-mono text-[9.5px] tracking-[0.22em] text-muted uppercase">Enterprise</span>
        </span>
      )}
    </Link>
  );
}
