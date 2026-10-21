import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-[color-mix(in_oklab,var(--brand)_70%,var(--brand-2))] text-primary-foreground shadow-[0_8px_30px_-8px_var(--glow)] hover:shadow-[0_10px_40px_-6px_var(--glow)] hover:brightness-110 active:scale-[0.98]",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:border-border-strong hover:bg-card",
        outline: "border border-input bg-transparent text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-white hover:brightness-110",
        brass: "bg-brass text-[#1a1203] hover:brightness-110 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonProps extends ComponentProps<"button">, ButtonVariantProps {
  asChild?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  icon,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link>, ButtonVariantProps {
  icon?: ReactNode;
}

/** Next.js Link styled as a button; the icon renders after the label. */
export function LinkButton({ variant, size, icon, className, children, ...props }: LinkButtonProps) {
  return (
    <Link data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
      {children}
      {icon}
    </Link>
  );
}
