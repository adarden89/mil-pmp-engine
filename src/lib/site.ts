export const SITE = {
  name: "MilToPMP Enterprise",
  shortName: "MilToPMP",
  tagline: "From your first billet to PMP, funded by the programs you already earned.",
  description:
    "A guided path for E-1 to O-3 service members: check CAPM vs. PMP eligibility, map COOL funding, translate evaluations into PMI-ready experience, and study smarter.",
  /**
   * Shown in the navbar status pill. Deliberately describes what the product does
   * rather than claiming a compliance status: no DoD or Navy body certifies
   * third-party study tools as "COOL compliant", and implying one would be a
   * false endorsement claim.
   */
  statusLabel: "Aligned to DoD COOL funding workflows",
  supportEmail: "support@example.com",
} as const;

export const LEGAL_DISCLAIMER =
  "MilToPMP Enterprise is an independent product. It is not affiliated with, endorsed by, or sponsored by the Department of Defense, the Department of the Navy, the U.S. Army, the U.S. Air Force, the U.S. Marine Corps, the U.S. Coast Guard, or the Project Management Institute (PMI). Funding decisions are made solely by your service's credentialing program and your command.";

export const PMI_TRADEMARK_NOTICE =
  "PMI, PMP, CAPM, PMBOK and Project Management Professional are registered marks of the Project Management Institute, Inc.";

export const NAV_LINKS = [
  { href: "/#eligibility", label: "Eligibility", longLabel: "Eligibility Calculator" },
  { href: "/funding", label: "Funding", longLabel: "COOL Funding Engine" },
  { href: "/translate", label: "Translate", longLabel: "Translation Studio" },
  { href: "/vault", label: "Study Vault", longLabel: "Study Vault" },
  { href: "/#pricing", label: "Pricing", longLabel: "Pricing" },
] as const;
