import { cn } from "@/lib/utils";

/**
 * Thumb-zone action bar. On phones it sticks to the bottom of the viewport
 * while its parent is on screen, with a blurred backdrop and room for the home
 * indicator; from `sm` up it is an ordinary inline row. Put the primary action
 * last so it lands under the right thumb.
 */
export function StickyActionBar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-50 -mx-6 mt-8 flex items-center justify-between gap-3 border-t border-border bg-background/80 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md",
        "sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
