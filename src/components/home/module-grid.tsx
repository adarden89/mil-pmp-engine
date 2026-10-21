import { ArrowRight, BookOpen, Landmark, Languages, Target } from "lucide-react";
import Link from "next/link";
import { Card, SectionHeading } from "@/components/ui/primitives";

const MODULES = [
  {
    href: "/#eligibility",
    icon: Target,
    title: "Eligibility Calculator",
    body: "Three questions tell you whether to go for the CAPM now or the PMP, based on PMI's actual experience rules rather than rank.",
    tag: "Free",
  },
  {
    href: "/funding",
    icon: Landmark,
    title: "COOL Funding Engine",
    body: "A step-by-step map for Navy COOL, Army Credentialing Assistance, AF COOL, USMC COOL, and USCG COOL, with a pre-filled packet.",
    tag: "Map free · Packet $12",
  },
  {
    href: "/translate",
    icon: Languages,
    title: "AI Translation Studio",
    body: "Turn EVAL, NCOER, EPB, and FITREP bullets into first-person PMI project descriptions, scored for audit risk.",
    tag: "Base Tool",
  },
  {
    href: "/vault",
    icon: BookOpen,
    title: "Study Vault",
    body: "Spaced-repetition flashcards across People, Process, and Business Environment, plus a vetted resource directory.",
    tag: "Sample free · Vault $17",
  },
] as const;

export function ModuleGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="The platform"
        title="One portal, four modules, zero guesswork"
        description="Each module solves a specific place where service members stall: not knowing which exam to take, how to get it funded, how to describe military work, or what to study."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((module) => (
          <Link key={module.title} href={module.href} className="group">
            <Card className="flex h-full flex-col p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-border-strong group-hover:shadow-[0_20px_50px_-20px_var(--glow)]">
              <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20">
                <module.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-base font-semibold">{module.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{module.body}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-wider text-subtle uppercase">{module.tag}</span>
                <ArrowRight
                  className="size-4 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-brand"
                  aria-hidden
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
