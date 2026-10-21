"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { useSession } from "@/components/providers/session-provider";
import { NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";

function StatusPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-medium whitespace-nowrap text-success",
        className,
      )}
      title="Workflows follow each service's published COOL and credentialing assistance process. Not an official DoD product."
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      {SITE.statusLabel}
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ownsBase = session.owns("base_tool");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-border bg-bg/80 backdrop-blur-xl" : "border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8" aria-label="Primary">
        <BrandMark />
        <StatusPill className="hidden xl:inline-flex" />

        <ul className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = !link.href.startsWith("/#") && pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                    active ? "text-fg" : "text-muted hover:text-fg",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          {session.signedIn ? (
            <LinkButton
              href="/dashboard"
              variant="secondary"
              size="sm"
              className="hidden sm:inline-flex"
              icon={<LayoutDashboard className="size-4" aria-hidden />}
            >
              Dashboard
            </LinkButton>
          ) : (
            <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </LinkButton>
          )}
          {!ownsBase ? (
            <LinkButton
              href="/#eligibility"
              size="sm"
              className="hidden sm:inline-flex"
              icon={<ArrowRight className="size-4" aria-hidden />}
            >
              Check eligibility
            </LinkButton>
          ) : null}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg border border-border text-muted lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border bg-bg/95 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              <StatusPill className="mb-3" />
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
                >
                  {link.longLabel}
                </Link>
              ))}
              <Link
                href={session.signedIn ? "/dashboard" : "/login"}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-fg hover:bg-surface-2"
              >
                {session.signedIn ? "Dashboard" : "Sign in"}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
