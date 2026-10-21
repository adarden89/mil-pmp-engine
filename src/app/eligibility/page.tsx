import type { Metadata } from "next";
import { EligibilityExperience } from "@/components/eligibility/eligibility-experience";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "CAPM vs. PMP Eligibility",
  description:
    "Three questions route you to the CAPM or the PMP using PMI's real experience rules, then build a beginner-to-certified roadmap you can track.",
};

export default function EligibilityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Zero-knowledge onboarding"
        title="Never managed a project on paper? Start here."
        description="Answer three questions and get your path, CAPM or PMP, plus a step-by-step roadmap to certification with the exam paid by your service's credentialing program."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <EligibilityExperience />
      </div>
    </>
  );
}
