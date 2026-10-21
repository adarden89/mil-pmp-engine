import type { Metadata } from "next";
import { FundingPageClient } from "@/components/funding/funding-page-client";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "COOL Funding Engine",
  description:
    "Step-by-step workflows for Navy COOL, Army Credentialing Assistance, Air Force COOL, Marine Corps COOL, and Coast Guard COOL funding of CAPM and PMP exams.",
};

export default function FundingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Funding engine"
        title="Get your exam funded, one checkpoint at a time"
        description="Pick your service and follow the map. Mark steps done as you go; your progress stays on this device. Who owns each step is shown so you know when to push and when to wait."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <FundingPageClient />
      </div>
    </>
  );
}
