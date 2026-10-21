import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** High-contrast status banners. `critical` is reserved for warnings that can cost the member money. */
export const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-xl border px-4 py-3.5 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-primary/30 bg-primary/10 text-foreground [&>svg]:text-primary",
        success: "border-success/35 bg-success/10 text-foreground [&>svg]:text-success",
        warning: "border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning",
        critical:
          "border-2 border-destructive bg-destructive/12 text-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--danger)_12%,transparent)] [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Alert({ className, variant, ...props }: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="alert-title" className={cn("col-start-2 font-semibold tracking-tight", className)} {...props} />
  );
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
