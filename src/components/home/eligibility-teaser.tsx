import { ArrowRight, GraduationCap, Map, Medal, Timer } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/primitives";

const STEPS = [
  { icon: Medal, title: "Branch and pay grade", body: "E-1 through O-6, every service." },
  { icon: GraduationCap, title: "Education", body: "Sets PMI's 36 or 60 month bar for the PMP." },
  { icon: Timer, title: "Project leadership", body: "Months leading work, not time in service." },
  { icon: Map, title: "Your roadmap", body: "CAPM or PMP, with every step to $0-out-of-pocket certification." },
];

export function EligibilityTeaser() {
  return (
    <section id="eligibility" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Zero-knowledge onboarding"
        title="CAPM or PMP? Know in three questions."
        description="Built on PMI's actual experience rules, so a 'go' here is a go you can defend in an audit. Then you get a roadmap you can check off, step by step."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Card key={step.title} className="p-6">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <step.icon className="size-5" aria-hidden />
              </span>
              <span className="font-mono text-xs text-subtle">0{index + 1}</span>
            </div>
            <h3 className="mt-5 font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
          </Card>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <LinkButton href="/eligibility" size="lg" icon={<ArrowRight className="size-4" aria-hidden />}>
          Start the 3-question check
        </LinkButton>
      </div>
    </section>
  );
}
