import { EligibilityTeaser } from "@/components/home/eligibility-teaser";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { ModuleGrid } from "@/components/home/module-grid";
import { PricingTiers } from "@/components/pricing/pricing-tiers";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ModuleGrid />
      <EligibilityTeaser />
      <PricingTiers />
      <Faq />
    </>
  );
}
