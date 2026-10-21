import Link from "next/link";
import { LEGAL_DISCLAIMER, NAV_LINKS, PMI_TRADEMARK_NOTICE, SITE } from "@/lib/site";
import { BrandMark } from "./brand-mark";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-bg-elevated/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{SITE.tagline}</p>
        </div>
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-subtle uppercase">Platform</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground transition-colors hover:text-fg">
                  {link.longLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-subtle uppercase">Official sources</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href="https://www.cool.osd.mil/"
                className="text-muted-foreground hover:text-fg"
                target="_blank"
                rel="noreferrer"
              >
                DoD COOL
              </a>
            </li>
            <li>
              <a
                href="https://jst.doded.mil/"
                className="text-muted-foreground hover:text-fg"
                target="_blank"
                rel="noreferrer"
              >
                Joint Services Transcript
              </a>
            </li>
            <li>
              <a
                href="https://www.pmi.org/certifications"
                className="text-muted-foreground hover:text-fg"
                target="_blank"
                rel="noreferrer"
              >
                PMI certifications
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-6 text-xs leading-relaxed text-subtle sm:px-6 lg:px-8">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-fg">
              Privacy policy
            </Link>
            <Link href="/terms" className="hover:text-fg">
              Terms
            </Link>
            <Link href="/privacy#choices" className="hover:text-fg">
              Do Not Sell or Share My Personal Information
            </Link>
          </p>
          <p>{LEGAL_DISCLAIMER}</p>
          <p>{PMI_TRADEMARK_NOTICE}</p>
          <p>
            © {SITE.name}. Questions: {SITE.supportEmail}
          </p>
        </div>
      </div>
    </footer>
  );
}
