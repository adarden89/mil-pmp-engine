import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/ui/primitives";

const FAQ = [
  {
    q: "Can I use Tuition Assistance to pay for this?",
    a: "No. Tuition Assistance pays for college courses from accredited schools. Exam fees are funded through your service's COOL or credentialing assistance program, paid directly to PMI. This tool is a separate, low-cost purchase that helps you get through that process correctly.",
  },
  {
    q: "Is MilToPMP endorsed by the DoD, my service, or PMI?",
    a: "No. MilToPMP is independent. The funding workflows follow each program's published process, but only your COOL office and command can approve funding, and only PMI can approve your application.",
  },
  {
    q: "I'm an E-4 with no project management background. Is the PMP realistic?",
    a: "Usually not yet. The PMP requires 36 to 60 months leading projects, depending on your education. The CAPM requires no experience, only 23 hours of PM education, and it counts toward the PMP's education requirement later. The 3-question check routes you, and the Accidental PM Mapper shows which of your duties count as projects.",
  },
  {
    q: "Will the AI write my experience for me?",
    a: "It translates what you actually did into civilian PMI language. It is instructed never to invent numbers or responsibilities, and it flags anything you should verify. PMI audits applications, and your supervisor must be able to confirm every line.",
  },
  {
    q: "Do I need an account before I buy?",
    a: "No. Check out with your email; we set up your account automatically and email you a secure sign-in link. No password to remember.",
  },
  {
    q: "What if my bank blocks the 1-click add-on?",
    a: "If your bank asks you to confirm the payment, you'll be sent to Stripe's secure checkout to approve it. You're never charged twice.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Straight answers" title="Questions service members ask first" />
      <Accordion type="single" collapsible className="mt-12 rounded-2xl border border-border bg-card/60 px-6">
        {FAQ.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
