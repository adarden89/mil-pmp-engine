"use client";

import { useState } from "react";
import { usePlan } from "@/components/eligibility/plan-store";
import { fundingProgramFor, type FundingProgramId } from "@/lib/funding-data";
import { EducationDirectory } from "./education-directory";
import { FundingEngine } from "./funding-engine";
import { NavyCoolWarningGate } from "./navy-cool-warning";
import { OpnavFormGenerator } from "./opnav-form-generator";

/**
 * Shares the selected service between the workflow map and the packet builder.
 * Until the member picks a tab, the branch from their eligibility plan routes
 * them to their own program (Space Force to AF COOL).
 */
export function FundingPageClient() {
  const plan = usePlan();
  const [chosen, setChosen] = useState<FundingProgramId | null>(null);
  const branch = chosen ?? (plan.input ? fundingProgramFor(plan.input.branch) : "navy");
  return (
    <NavyCoolWarningGate>
      <div className="mt-10 space-y-24">
        <FundingEngine branch={branch} onBranchChange={setChosen} />
        <OpnavFormGenerator branch={branch} />
        <EducationDirectory />
      </div>
    </NavyCoolWarningGate>
  );
}
