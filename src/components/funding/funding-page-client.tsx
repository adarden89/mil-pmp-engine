"use client";

import { useState } from "react";
import type { FundingProgramId } from "@/lib/funding-data";
import { DocumentDownloads } from "./document-downloads";
import { FundingEngine } from "./funding-engine";

/** Shares the selected service between the workflow map and the packet builder. */
export function FundingPageClient() {
  const [branch, setBranch] = useState<FundingProgramId>("navy");
  return (
    <div className="space-y-20">
      <FundingEngine branch={branch} onBranchChange={setBranch} />
      <DocumentDownloads branch={branch} />
    </div>
  );
}
