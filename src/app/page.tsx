import { EligibilityCalculator } from "@/components/eligibility/eligibility-calculator";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { ModuleGrid } from "@/components/home/module-grid";
import { PricingTiers } from "@/components/pricing/pricing-tiers";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ModuleGrid />
      <EligibilityCalculator />
      <PricingTiers />
      <Faq />
    </>
  );
}
