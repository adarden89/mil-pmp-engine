"use client";

import { useState } from "react";
import type { FundingProgramId } from "@/lib/funding-data";
import { EducationDirectory } from "./education-directory";
import { FundingEngine } from "./funding-engine";
import { NavyCoolWarningGate } from "./navy-cool-warning";
import { OpnavFormGenerator } from "./opnav-form-generator";

/** Shares the selected service between the workflow map and the packet builder. */
export function FundingPageClient() {
  const [branch, setBranch] = useState<FundingProgramId>("navy");
  return (
    <NavyCoolWarningGate>
      <div className="mt-10 space-y-24">
        <FundingEngine branch={branch} onBranchChange={setBranch} />
        <OpnavFormGenerator branch={branch} />
        <EducationDirectory />
      </div>
    </NavyCoolWarningGate>
  );
}
