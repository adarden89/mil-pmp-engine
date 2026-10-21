import { describe, expect, it } from "vitest";
import { SAMPLE_REQUEST, SAMPLE_TRANSLATION } from "@/lib/sample-translation";
import { EMPTY_PROCESS_GROUPS, projectFromSaved, type SupervisorPacket } from "@/lib/supervisor-packet";
import { buildVerificationPdf } from "./verification-pdf";

const packet: SupervisorPacket = {
  applicant: { name: "Jordan Rivera", dutyTitle: "Leading Petty Officer", contact: "jordan.rivera@example.com" },
  supervisor: { name: "LCDR Dana Ortiz", role: "department_head", email: "" },
  project: projectFromSaved({
    id: "8d6f1f2e-0d39-4f39-9d3b-7c8c3f1e2a10",
    projectTitle: SAMPLE_REQUEST.projectTitle,
    civilianProjectTitle: SAMPLE_TRANSLATION.civilianProjectTitle,
    branch: "navy",
    startMonth: SAMPLE_REQUEST.startMonth,
    endMonth: SAMPLE_REQUEST.endMonth,
    createdAt: "2026-10-01T12:00:00Z",
    input: SAMPLE_REQUEST,
    translation: SAMPLE_TRANSLATION,
  }),
};

function render(input: SupervisorPacket) {
  const pdf = buildVerificationPdf(input, new Date("2026-10-21T12:00:00Z"));
  const pages = pdf.doc.getNumberOfPages();
  const raw = new TextDecoder("latin1").decode(new Uint8Array(pdf.toArrayBuffer()));
  return { pages, raw };
}

describe("buildVerificationPdf", () => {
  it("fits the sample packet on one page with the footer, columns, and integrity sentence", () => {
    const { pages, raw } = render(packet);
    expect(raw.startsWith("%PDF-")).toBe(true);
    expect(pages).toBe(1);
    expect(raw).toContain("Prepared by the applicant with MilToPMP. Not a PMI form.");
    expect(raw).toContain("What my evaluation says");
    expect(raw).toContain("What I wrote for PMI");
    expect(raw).toContain("Please confirm only what you directly observed.");
    expect(raw).not.toMatch(/undefined|NaN/);
  });

  it("flows long text onto another page and repeats the column headings", () => {
    const long = Array.from({ length: 90 }, (_, index) => `- Bullet ${index + 1}: coordinated a work package.`);
    const { pages, raw } = render({
      ...packet,
      project: { ...packet.project, militaryText: long.join("\n") },
    });
    expect(pages).toBeGreaterThan(1);
    expect(raw).toContain("What my evaluation says \\(continued\\)");
    expect(raw).not.toMatch(/NaN/);
  });

  it("renders a manual packet with no glossary or process groups", () => {
    const { pages, raw } = render({
      ...packet,
      project: { ...packet.project, pmiTitle: "", glossary: [], processGroups: EMPTY_PROCESS_GROUPS },
    });
    expect(pages).toBe(1);
    expect(raw).not.toContain("MILITARY TERMS");
    expect(raw).not.toContain("PROCESS GROUPS");
  });
});
