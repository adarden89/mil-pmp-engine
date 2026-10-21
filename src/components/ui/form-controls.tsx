"use client";

import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive, Label as LabelPrimitive, Progress as ProgressPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-lg border border-border bg-bg-elevated px-3 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldBase, "h-10 py-2", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldBase, "min-h-24 py-2.5", className)} {...props} />;
}

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return <select data-slot="native-select" className={cn(fieldBase, "h-10 py-2", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4.5 shrink-0 rounded-[5px] border border-border-strong bg-bg-elevated transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

const progressTone = {
  brand: "bg-gradient-to-r from-primary to-brand-2",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
} as const;

export function Progress({
  className,
  value,
  tone = "brand",
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root> & { tone?: keyof typeof progressTone }) {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={clamped}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", progressTone[tone])}
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
