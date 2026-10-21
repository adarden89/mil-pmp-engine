import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Surface container. Padding is set by the caller or by CardHeader/CardContent. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-2xl border border-border bg-card/80 text-card-foreground shadow-[0_1px_0_0_rgb(255_255_255/0.03)_inset] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1.5 px-6 pt-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6 py-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6 pb-6", className)} {...props} />;
}
