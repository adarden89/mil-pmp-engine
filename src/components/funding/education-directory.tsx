import { ExternalLink, GraduationCap, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/primitives";
import { BRANCH_PORTALS } from "@/lib/pmi-facts";
import { resourcesFor } from "@/lib/resources";

const PORTALS = [BRANCH_PORTALS.navy, BRANCH_PORTALS.army, BRANCH_PORTALS.air_force] as const;

export function EducationDirectory() {
  const courses = resourcesFor("education");
  return (
    <section id="education" className="scroll-mt-24">
      <SectionHeading
        align="left"
        eyebrow="35-hour education directory"
        title="Get your contact hours without wasting your money"
        description="The PMP needs 35 contact hours of project management education and the CAPM needs 23. These are the routes members use most. Navy COOL funds exams, not courses, so check what your own program covers before paying."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" aria-hidden />
              </span>
              {course.highlight ? <Badge variant="brand">{course.highlight}</Badge> : null}
            </div>
            <h3 className="mt-4 font-semibold">{course.name}</h3>
            <p className="text-xs text-subtle">{course.provider}</p>
            <p className="mt-3 text-sm">
              <span className="text-subtle">Best for: </span>
              {course.bestFor}
            </p>
            <ul className="mt-3 flex-1 space-y-1.5">
              {course.breakdown.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            {course.caution ? <p className="mt-4 text-xs text-warning">{course.caution}</p> : null}
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-muted-foreground">{course.cost}</span>
              <a
                href={course.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-5 grid gap-4 p-6 md:grid-cols-[auto_1fr] md:items-center">
        <span className="grid size-10 place-items-center rounded-xl bg-brass/15 text-brass">
          <Landmark className="size-5" aria-hidden />
        </span>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="text-sm font-semibold">Official funding portals</p>
          {PORTALS.map((portal) => (
            <a
              key={portal.url}
              href={portal.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              {portal.name} <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ))}
        </div>
      </Card>
    </section>
  );
}
